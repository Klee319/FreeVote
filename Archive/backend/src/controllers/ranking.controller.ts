import { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { AppError } from '../utils/errors';
import { RankingService } from '../services/ranking.service';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const rankingService = new RankingService(prisma, redis);

export class RankingController {
  /**
   * ランキング取得
   */
  static getRankingValidation = [
    query('period')
      .optional()
      .isIn(['7d', '30d', 'all'])
      .withMessage('有効な期間を指定してください'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('有効な取得件数を指定してください'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('有効なオフセットを指定してください'),
    query('categoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('有効なカテゴリIDを指定してください'),
    query('prefectureCode')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
    query('ageGroup')
      .optional()
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .withMessage('有効な年齢層を指定してください'),
    query('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('有効な性別を指定してください'),
  ];

  static async getRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const period = (req.query.period as '7d' | '30d' | 'all') || '30d';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const prefectureCode = req.query.prefectureCode as string | undefined;
      const ageGroup = req.query.ageGroup as string | undefined;
      const gender = req.query.gender as string | undefined;

      // 都道府県別ランキング取得
      const ranking = await rankingService.getPrefectureRanking({
        prefectureCode,
        period,
        limit,
        offset,
        ageGroup,
        gender
      });

      res.status(200).json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 都道府県比較データ取得
   */
  static getComparisonValidation = [
    query('prefectures')
      .isArray({ min: 2, max: 3 })
      .withMessage('2〜3つの都道府県コードを指定してください'),
    query('prefectures.*')
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
  ];

  static async getComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const prefectures = req.query.prefectures as string[];
      
      const comparisonData = await rankingService.getComparisonData(prefectures);

      res.status(200).json({
        success: true,
        data: comparisonData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ランキングCSVエクスポート
   */
  static exportCSVValidation = [
    query('period')
      .optional()
      .isIn(['7d', '30d', 'all'])
      .withMessage('有効な期間を指定してください'),
    query('prefectureCode')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
    query('ageGroup')
      .optional()
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .withMessage('有効な年齢層を指定してください'),
    query('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('有効な性別を指定してください'),
  ];

  static async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const period = (req.query.period as '7d' | '30d' | 'all') || '30d';
      const prefectureCode = req.query.prefectureCode as string | undefined;
      const ageGroup = req.query.ageGroup as string | undefined;
      const gender = req.query.gender as string | undefined;

      const csvData = await rankingService.generateCSVData({
        prefectureCode,
        period,
        ageGroup,
        gender
      });

      // CSVファイル名生成
      const filename = `ranking_${prefectureCode || 'all'}_${period}_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send('\uFEFF' + csvData); // BOM付きでUTF-8エンコード
    } catch (error) {
      next(error);
    }
  }

  /**
   * トレンディング（急上昇）語取得
   */
  static getTrendingValidation = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('有効な取得件数を指定してください'),
    query('hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('有効な時間範囲を指定してください'),
  ];

  static async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const hours = parseInt(req.query.hours as string) || 24;

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      // 最近の投票を集計
      const recentVotes = await prisma.vote.groupBy({
        by: ['wordId'],
        where: {
          createdAt: { gte: cutoffTime },
          word: { status: 'approved' },
        },
        _count: { id: true },
        orderBy: {
          _count: { id: 'desc' },
        },
        take: limit * 2, // より多く取得して比較用
      });

      // 過去の投票数と比較
      const comparisonTime = new Date(cutoffTime);
      comparisonTime.setHours(comparisonTime.getHours() - hours);

      const pastVotes = await prisma.vote.groupBy({
        by: ['wordId'],
        where: {
          createdAt: {
            gte: comparisonTime,
            lt: cutoffTime,
          },
          word: { status: 'approved' },
        },
        _count: { id: true },
      });

      // 増加率を計算
      const trendingWords = recentVotes.map((recent) => {
        const past = pastVotes.find((p) => p.wordId === recent.wordId);
        const pastCount = past?._count.id || 0;
        const growthRate = pastCount > 0 
          ? (recent._count.id - pastCount) / pastCount 
          : recent._count.id;

        return {
          wordId: recent.wordId,
          recentVotes: recent._count.id,
          pastVotes: pastCount,
          growthRate,
        };
      });

      // 増加率でソート
      trendingWords.sort((a, b) => b.growthRate - a.growthRate);
      const topTrending = trendingWords.slice(0, limit);

      // 語の詳細情報を取得
      const wordIds = topTrending.map((t) => t.wordId);
      const words = await prisma.word.findMany({
        where: { id: { in: wordIds } },
        include: {
          category: true,
          nationalStats: {
            include: { accentType: true },
            orderBy: { voteCount: 'desc' },
            take: 1,
          },
        },
      });

      // トレンディングデータと語情報を結合
      const result = topTrending.map((t, index) => {
        const word = words.find((w) => w.id === t.wordId);
        return {
          rank: index + 1,
          word,
          recentVotes: t.recentVotes,
          growthRate: Math.round(t.growthRate * 100),
          topAccent: word?.nationalStats[0] || null,
        };
      });

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          hours,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新着語取得
   */
  static getRecentWordsValidation = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('有効な取得件数を指定してください'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('有効なオフセットを指定してください'),
  ];

  static async getRecentWords(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const recentWords = await prisma.word.findMany({
        where: { status: 'approved' },
        include: {
          category: true,
          submitter: {
            select: {
              displayName: true,
              prefectureCode: true,
            },
          },
          _count: {
            select: { votes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      res.status(200).json({
        success: true,
        data: recentWords,
        pagination: {
          limit,
          offset,
          count: recentWords.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}