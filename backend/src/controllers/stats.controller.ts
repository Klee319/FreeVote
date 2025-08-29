import { Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export class StatsController {
  /**
   * 都道府県別統計取得
   */
  static getPrefectureStatsValidation = [
    param('wordId').isInt({ min: 1 }).withMessage('有効な語IDを指定してください'),
  ];

  static async getPrefectureStats(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const wordId = parseInt(req.params.wordId);

      // 語の存在確認
      const word = await prisma.word.findUnique({
        where: { id: wordId },
        include: { category: true },
      });

      if (!word) {
        throw new AppError('指定された語が見つかりません', 404);
      }

      // 都道府県別統計を取得
      const stats = await prisma.wordPrefStats.findMany({
        where: { wordId },
        include: {
          prefecture: true,
          accentType: true,
        },
        orderBy: [
          { prefectureCode: 'asc' },
          { voteCount: 'desc' },
        ],
      });

      // 都道府県ごとにグループ化
      const prefectureMap = new Map<string, any>();
      
      for (const stat of stats) {
        const code = stat.prefectureCode;
        if (!prefectureMap.has(code)) {
          prefectureMap.set(code, {
            prefecture: stat.prefecture,
            totalVotes: stat.totalVotesInPref,
            accentDistribution: [],
          });
        }
        
        prefectureMap.get(code)!.accentDistribution.push({
          accentType: stat.accentType,
          voteCount: stat.voteCount,
          percentage: parseFloat(stat.votePercentage.toString()),
        });
      }

      // 全国統計も取得
      const nationalStats = await prisma.wordNationalStats.findMany({
        where: { wordId },
        include: { accentType: true },
        orderBy: { voteCount: 'desc' },
      });

      const result = {
        word,
        national: {
          totalVotes: nationalStats.reduce((sum, s) => sum + s.totalVotes, 0) / nationalStats.length || 0,
          distribution: nationalStats.map((s) => ({
            accentType: s.accentType,
            voteCount: s.voteCount,
            percentage: parseFloat(s.votePercentage.toString()),
          })),
        },
        byPrefecture: Array.from(prefectureMap.values()),
      };

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * サイト全体統計取得
   */
  static async getSiteStats(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 統計を集計
      const [
        totalWords,
        totalVotes,
        totalUsers,
        todayVotes,
        weekVotes,
        monthVotes,
        activeWords,
        pendingSubmissions,
      ] = await Promise.all([
        prisma.word.count({ where: { status: 'approved' } }),
        prisma.vote.count(),
        prisma.user.count(),
        prisma.vote.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.vote.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.vote.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.vote.groupBy({
          by: ['wordId'],
          where: { createdAt: { gte: startOfWeek } },
          _count: true,
        }).then((r) => r.length),
        prisma.submission.count({ where: { status: 'pending' } }),
      ]);

      // カテゴリ別統計
      const categoryStats = await prisma.word.groupBy({
        by: ['categoryId'],
        where: { status: 'approved' },
        _count: { id: true },
      });

      const categories = await prisma.wordCategory.findMany({
        where: {
          id: { in: categoryStats.map((c) => c.categoryId).filter((id): id is number => id !== null) },
        },
      });

      const categoryData = categoryStats.map((stat) => {
        const category = categories.find((c) => c.id === stat.categoryId);
        return {
          category: category?.name || '未分類',
          wordCount: stat._count.id,
        };
      });

      // 人気のアクセント型
      const popularAccents = await prisma.vote.groupBy({
        by: ['accentTypeId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });

      const accentTypes = await prisma.accentType.findMany({
        where: { id: { in: popularAccents.map((a) => a.accentTypeId) } },
      });

      const accentData = popularAccents.map((accent) => {
        const type = accentTypes.find((t) => t.id === accent.accentTypeId);
        return {
          accentType: type?.name || '不明',
          voteCount: accent._count.id,
        };
      });

      const result = {
        overview: {
          totalWords,
          totalVotes,
          totalUsers,
          activeWords,
          pendingSubmissions,
        },
        activity: {
          today: todayVotes,
          thisWeek: weekVotes,
          thisMonth: monthVotes,
        },
        categories: categoryData,
        popularAccents: accentData,
      };

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * トレンド分析
   */
  static getTrendsValidation = [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('有効な日数を指定してください'),
  ];

  static async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 日別投票数を集計
      const dailyVotes = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM votes
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // 地域別トレンド
      const regionalTrends = await prisma.vote.groupBy({
        by: ['prefectureCode'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const prefectures = await prisma.prefecture.findMany({
        where: {
          code: { in: regionalTrends.map((r) => r.prefectureCode).filter((c): c is string => c !== null) },
        },
      });

      const regionalData = regionalTrends.map((trend) => {
        const prefecture = prefectures.find((p) => p.code === trend.prefectureCode);
        return {
          prefecture: prefecture?.name || '不明',
          region: prefecture?.region || '不明',
          voteCount: trend._count.id,
        };
      });

      // 年齢層別トレンド
      const ageGroupTrends = await prisma.vote.groupBy({
        by: ['ageGroup'],
        where: { 
          createdAt: { gte: startDate },
          ageGroup: { not: null },
        },
        _count: { id: true },
        orderBy: { ageGroup: 'asc' },
      });

      const result = {
        dailyActivity: dailyVotes.map((d) => ({
          date: d.date,
          votes: Number(d.count),
        })),
        regionalTrends: regionalData,
        ageGroupTrends: ageGroupTrends.map((a) => ({
          ageGroup: a.ageGroup,
          voteCount: a._count.id,
        })),
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
      };

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}