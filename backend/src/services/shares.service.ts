import { PrismaClient, User, ShareRanking } from '@prisma/client';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

interface ShareTrackParams {
  pollId: string;
  userId: string;
  platform: string;
}

interface ShareRankingParams {
  period: 'today' | 'week' | 'month' | 'all';
  limit: number;
  offset: number;
}

interface UserShareStats {
  totalShares: number;
  todayShares: number;
  weekShares: number;
  monthShares: number;
  rankings: {
    today?: { rank: number; totalUsers: number };
    week?: { rank: number; totalUsers: number };
    month?: { rank: number; totalUsers: number };
    all?: { rank: number; totalUsers: number };
  };
  recentShares: Array<{
    pollId: string;
    pollTitle: string;
    platform: string;
    sharedAt: Date;
  }>;
}

export class ShareService {
  /**
   * シェア活動を記録
   */
  async trackShare(params: ShareTrackParams): Promise<{ shareCount: number; userShareCount: number }> {
    const { pollId, userId, platform } = params;

    // 投票の存在確認
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      throw new AppError('投票が見つかりません', 404);
    }

    // トランザクション内で処理
    const result = await prisma.$transaction(async (tx) => {
      // 既存のシェア記録をチェック
      const existingShare = await tx.userShareActivity.findUnique({
        where: {
          userId_pollId_platform: {
            userId,
            pollId,
            platform
          }
        }
      });

      // 新規シェアの場合のみカウントアップ
      if (!existingShare) {
        // シェア活動を記録
        await tx.userShareActivity.create({
          data: {
            userId,
            pollId,
            platform
          }
        });

        // ユーザーの総シェア数を更新
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            shareCount: {
              increment: 1
            }
          }
        });

        return {
          shareCount: 1, // 新規シェア
          userShareCount: updatedUser.shareCount
        };
      }

      // 既存シェアの場合は現在のカウントを返す
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      return {
        shareCount: 1, // 既にシェア済み
        userShareCount: user?.shareCount || 0
      };
    });

    return result;
  }

  /**
   * シェアランキングを取得
   */
  async getRanking(params: ShareRankingParams): Promise<{
    period: string;
    rankings: Array<{
      rank: number;
      user: {
        id: string;
        username: string | null;
        shareCount: number;
      };
      shareCount: number;
      rankChange?: number;
    }>;
    updatedAt: Date;
  }> {
    const { period, limit, offset } = params;

    // まず最新のランキングを計算
    await this.calculateRanking(period);

    // キャッシュされたランキングを取得
    const rankings = await prisma.shareRanking.findMany({
      where: { period },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            shareCount: true
          }
        }
      },
      orderBy: { rank: 'asc' },
      skip: offset,
      take: limit
    });

    // ランキング変動を計算
    const formattedRankings = rankings.map(ranking => ({
      rank: ranking.rank,
      user: ranking.user,
      shareCount: ranking.shareCount,
      rankChange: ranking.prevRank ? ranking.prevRank - ranking.rank : undefined
    }));

    return {
      period,
      rankings: formattedRankings,
      updatedAt: rankings[0]?.calculatedAt || new Date()
    };
  }

  /**
   * ランキングを計算して更新
   */
  private async calculateRanking(period: 'today' | 'week' | 'month' | 'all'): Promise<void> {
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        dateFrom = new Date(0); // 全期間
        break;
    }

    // 期間内のシェア数を集計
    const shareStats = await prisma.userShareActivity.groupBy({
      by: ['userId'],
      where: {
        sharedAt: {
          gte: dateFrom
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // 現在のランキングを取得（前回順位の記録用）
    const currentRankings = await prisma.shareRanking.findMany({
      where: { period }
    });

    const prevRankMap = new Map(
      currentRankings.map(r => [r.userId, r.rank])
    );

    // トランザクション内でランキングを更新
    await prisma.$transaction(async (tx) => {
      // 古いランキングを削除
      await tx.shareRanking.deleteMany({
        where: { period }
      });

      // 新しいランキングを作成
      const rankings = shareStats.map((stat, index) => ({
        userId: stat.userId,
        period,
        shareCount: stat._count.id,
        rank: index + 1,
        prevRank: prevRankMap.get(stat.userId) || null,
        calculatedAt: now
      }));

      if (rankings.length > 0) {
        await tx.shareRanking.createMany({
          data: rankings
        });
      }
    });
  }

  /**
   * ユーザーのシェア統計を取得
   */
  async getUserStats(userId: string): Promise<UserShareStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    // 各期間のシェア数を取得
    const [todayShares, weekShares, monthShares] = await Promise.all([
      prisma.userShareActivity.count({
        where: {
          userId,
          sharedAt: { gte: todayStart }
        }
      }),
      prisma.userShareActivity.count({
        where: {
          userId,
          sharedAt: { gte: weekAgo }
        }
      }),
      prisma.userShareActivity.count({
        where: {
          userId,
          sharedAt: { gte: monthAgo }
        }
      })
    ]);

    // 各期間のランキング情報を取得
    const rankings = await prisma.shareRanking.findMany({
      where: { userId }
    });

    // 最近のシェア活動を取得
    const recentShares = await prisma.userShareActivity.findMany({
      where: { userId },
      include: {
        poll: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' },
      take: 10
    });

    // 各期間の総ユーザー数を取得
    const [todayTotal, weekTotal, monthTotal, allTotal] = await Promise.all([
      prisma.shareRanking.count({ where: { period: 'today' } }),
      prisma.shareRanking.count({ where: { period: 'week' } }),
      prisma.shareRanking.count({ where: { period: 'month' } }),
      prisma.shareRanking.count({ where: { period: 'all' } })
    ]);

    const rankingMap = new Map(rankings.map(r => [r.period, r]));

    return {
      totalShares: user.shareCount,
      todayShares,
      weekShares,
      monthShares,
      rankings: {
        today: rankingMap.has('today')
          ? { rank: rankingMap.get('today')!.rank, totalUsers: todayTotal }
          : undefined,
        week: rankingMap.has('week')
          ? { rank: rankingMap.get('week')!.rank, totalUsers: weekTotal }
          : undefined,
        month: rankingMap.has('month')
          ? { rank: rankingMap.get('month')!.rank, totalUsers: monthTotal }
          : undefined,
        all: rankingMap.has('all')
          ? { rank: rankingMap.get('all')!.rank, totalUsers: allTotal }
          : undefined
      },
      recentShares: recentShares.map(share => ({
        pollId: share.pollId,
        pollTitle: share.poll.title,
        platform: share.platform,
        sharedAt: share.sharedAt
      }))
    };
  }

  /**
   * 特定ユーザーのシェア統計を取得（公開用）
   */
  async getPublicUserStats(userId: string): Promise<{
    user: {
      id: string;
      username: string | null;
    };
    totalShares: number;
    rankings: {
      week?: { rank: number };
      month?: { rank: number };
      all?: { rank: number };
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        shareCount: true
      }
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    const rankings = await prisma.shareRanking.findMany({
      where: {
        userId,
        period: { in: ['week', 'month', 'all'] }
      }
    });

    const rankingMap = new Map(rankings.map(r => [r.period, r.rank]));

    return {
      user: {
        id: user.id,
        username: user.username
      },
      totalShares: user.shareCount,
      rankings: {
        week: rankingMap.has('week') ? { rank: rankingMap.get('week')! } : undefined,
        month: rankingMap.has('month') ? { rank: rankingMap.get('month')! } : undefined,
        all: rankingMap.has('all') ? { rank: rankingMap.get('all')! } : undefined
      }
    };
  }
}