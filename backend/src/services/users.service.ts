import { PrismaClient, User, PollVote } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  showInShareRanking?: boolean;
  showVoteHistory?: boolean;
  twitterId?: string;
  instagramId?: string;
  tiktokId?: string;
}

export interface StatusUpdateData {
  ageGroup?: string;
  prefecture?: string;
  gender?: string;
}

export interface VotingHistoryParams {
  userId: string;
  page?: number;
  limit?: number;
  category?: string;
}

export interface UserStats {
  totalVotes: number;
  totalShares: number;
  totalReferrals: number;
  joinedDate: Date;
  lastVoteDate?: Date;
  favoriteCategories: Array<{category: string, count: number}>;
}

export class UserService {
  /**
   * ユーザープロフィールを取得
   */
  async getUserProfile(userId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        provider: true,
        providerId: true,
        twitterId: true,
        instagramId: true,
        tiktokId: true,
        avatarUrl: true,
        avatarSource: true,
        bio: true,
        showInShareRanking: true,
        showVoteHistory: true,
        shareCount: true,
        referralCount: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastStatusChangeDate: true
        // passwordHashは意図的に除外（セキュリティのため）
      }
    });
  }

  /**
   * プロフィール更新
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<User> {
    // ユーザー名の重複チェック
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw new AppError('このユーザー名は既に使用されています', 400);
      }
    }

    // SNS IDからアバター設定（優先順位: Twitter > Instagram > TikTok）
    let avatarUpdateData: { avatarUrl?: string; avatarSource?: string } = {};
    if (data.twitterId || data.instagramId || data.tiktokId) {
      if (data.twitterId) {
        // Twitter APIからアバター取得（実装は省略、実際のAPIコールが必要）
        avatarUpdateData.avatarSource = 'twitter';
        // avatarUpdateData.avatarUrl = await fetchTwitterAvatar(data.twitterId);
      } else if (data.instagramId) {
        avatarUpdateData.avatarSource = 'instagram';
        // avatarUpdateData.avatarUrl = await fetchInstagramAvatar(data.instagramId);
      } else if (data.tiktokId) {
        avatarUpdateData.avatarSource = 'tiktok';
        // avatarUpdateData.avatarUrl = await fetchTikTokAvatar(data.tiktokId);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...avatarUpdateData,
        updatedAt: new Date()
      }
    });
  }

  /**
   * ステータス更新（年1回制限チェック付き）
   */
  async updateStatus(userId: string, data: StatusUpdateData): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastStatusChangeDate: true }
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    // 年1回制限のチェック
    if (user.lastStatusChangeDate) {
      const lastChange = new Date(user.lastStatusChangeDate);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (lastChange > oneYearAgo) {
        const nextChangeDate = new Date(lastChange);
        nextChangeDate.setFullYear(nextChangeDate.getFullYear() + 1);
        throw new AppError(
          `ステータスは年1回のみ変更可能です。次回変更可能日: ${nextChangeDate.toLocaleDateString('ja-JP')}`,
          400
        );
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        lastStatusChangeDate: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * プロフィール画像更新
   */
  async updateProfileImage(userId: string, imageUrl: string): Promise<string> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: imageUrl,
        avatarSource: 'avatar_upload',
        updatedAt: new Date()
      }
    });

    return imageUrl;
  }

  /**
   * 投票履歴取得
   */
  async getVotingHistory(params: VotingHistoryParams) {
    const { userId, page = 1, limit = 20, category } = params;
    const offset = (page - 1) * limit;

    // カテゴリフィルタリング用のクエリ条件
    const whereCondition: any = {
      userId,
      poll: category ? {
        categories: {
          contains: category
        }
      } : undefined
    };

    const [votes, total] = await Promise.all([
      prisma.pollVote.findMany({
        where: whereCondition,
        include: {
          poll: {
            select: {
              id: true,
              title: true,
              categories: true,
              thumbnailUrl: true,
              options: true
            }
          }
        },
        orderBy: { votedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.pollVote.count({ where: whereCondition })
    ]);

    // 選択肢の詳細を含めた履歴データの整形
    const history = votes.map(vote => ({
      poll: {
        id: vote.poll.id,
        title: vote.poll.title,
        categories: JSON.parse(vote.poll.categories),
        thumbnailUrl: vote.poll.thumbnailUrl
      },
      option: vote.option,
      optionLabel: JSON.parse(vote.poll.options)[vote.option]?.label || '',
      votedAt: vote.votedAt.toISOString()
    }));

    return {
      votes: history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * ユーザー統計取得
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        votes: {
          select: {
            votedAt: true,
            poll: {
              select: { categories: true }
            }
          },
          orderBy: { votedAt: 'desc' }
        },
        shareActivities: true,
        referrals: true
      }
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    // カテゴリ別集計
    const categoryCount: Record<string, number> = {};
    user.votes.forEach(vote => {
      const categories = JSON.parse(vote.poll.categories);
      categories.forEach((category: string) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    const favoriteCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVotes: user.votes.length,
      totalShares: user.shareCount,
      totalReferrals: user.referralCount,
      joinedDate: user.createdAt,
      lastVoteDate: user.votes[0]?.votedAt,
      favoriteCategories
    };
  }

  /**
   * SNS連携
   */
  async linkSns(userId: string, platform: string, providerId: string, handle: string): Promise<User> {
    const updateData: any = {};

    switch (platform) {
      case 'twitter':
        updateData.twitterId = handle;
        break;
      case 'instagram':
        updateData.instagramId = handle;
        break;
      case 'tiktok':
        updateData.tiktokId = handle;
        break;
      default:
        throw new AppError('無効なプラットフォームです', 400);
    }

    // プロバイダー情報も更新
    if (!updateData.provider) {
      updateData.provider = platform;
      updateData.providerId = providerId;
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  /**
   * SNS連携解除
   */
  async unlinkSns(userId: string, platform: string): Promise<User> {
    const updateData: any = {};

    switch (platform) {
      case 'twitter':
        updateData.twitterId = null;
        break;
      case 'instagram':
        updateData.instagramId = null;
        break;
      case 'tiktok':
        updateData.tiktokId = null;
        break;
      default:
        throw new AppError('無効なプラットフォームです', 400);
    }

    // アバターソースがこのSNSの場合はリセット
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarSource: true, provider: true }
    });

    if (user?.avatarSource === platform) {
      updateData.avatarUrl = null;
      updateData.avatarSource = null;
    }

    // プロバイダーが一致する場合はリセット
    if (user?.provider === platform) {
      updateData.provider = null;
      updateData.providerId = null;
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  /**
   * ステータス変更可能かチェック
   */
  async canChangeStatus(userId: string): Promise<{ canChange: boolean; nextChangeDate?: Date }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastStatusChangeDate: true }
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    if (!user.lastStatusChangeDate) {
      return { canChange: true };
    }

    const lastChange = new Date(user.lastStatusChangeDate);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    if (lastChange <= oneYearAgo) {
      return { canChange: true };
    }

    const nextChangeDate = new Date(lastChange);
    nextChangeDate.setFullYear(nextChangeDate.getFullYear() + 1);

    return {
      canChange: false,
      nextChangeDate
    };
  }
}

export default new UserService();