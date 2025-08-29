import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';

const router = Router();

/**
 * @route GET /api/stats/summary
 * @desc サイト全体統計取得
 * @access Public
 */
router.get('/summary', StatsController.getSiteStats);

/**
 * @route GET /api/stats/trends
 * @desc トレンド分析
 * @access Public
 */
router.get(
  '/trends',
  StatsController.getTrendsValidation,
  StatsController.getTrends
);

/**
 * @route GET /api/stats/prefectures/:wordId
 * @desc 都道府県別統計取得
 * @access Public
 */
router.get(
  '/prefectures/:wordId',
  StatsController.getPrefectureStatsValidation,
  StatsController.getPrefectureStats
);

export default router;