import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';

const router = Router();

/**
 * @route GET /api/ranking
 * @desc ランキング取得
 * @access Public
 */
router.get(
  '/',
  RankingController.getRankingValidation,
  RankingController.getRanking
);

/**
 * @route GET /api/ranking/trending
 * @desc トレンディング（急上昇）語取得
 * @access Public
 */
router.get(
  '/trending',
  RankingController.getTrendingValidation,
  RankingController.getTrending
);

/**
 * @route GET /api/ranking/recent
 * @desc 新着語取得
 * @access Public
 */
router.get(
  '/recent',
  RankingController.getRecentWordsValidation,
  RankingController.getRecentWords
);

/**
 * @route GET /api/ranking/comparison
 * @desc 都道府県比較データ取得
 * @access Public
 */
router.get(
  '/comparison',
  RankingController.getComparisonValidation,
  RankingController.getComparison
);

/**
 * @route GET /api/ranking/export
 * @desc ランキングCSVエクスポート
 * @access Public
 */
router.get(
  '/export',
  RankingController.exportCSVValidation,
  RankingController.exportCSV
);

export default router;