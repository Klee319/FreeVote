/**
 * Map Statistics Routes
 * 地図表示用統計APIエンドポイント
 */

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { param, query } from 'express-validator';

const router = Router();

/**
 * @route GET /api/stats/map/overview
 * @desc 全国概要統計を取得
 * @access Public
 */
router.get('/overview', StatsController.getMapOverview);

/**
 * @route GET /api/stats/map/:wordId
 * @desc 特定語の都道府県別統計を取得
 * @access Public
 * @param wordId 語のID
 */
router.get(
  '/:wordId',
  [
    param('wordId')
      .isInt({ min: 1 })
      .withMessage('有効な語IDを指定してください'),
  ],
  StatsController.getWordMapStats
);

/**
 * @route GET /api/stats/map/prefecture/:code
 * @desc 特定都道府県の全語統計を取得
 * @access Public
 * @param code 都道府県コード (01-47)
 */
router.get(
  '/prefecture/:code',
  [
    param('code')
      .matches(/^(0[1-9]|[1-3][0-9]|4[0-7])$/)
      .withMessage('有効な都道府県コードを指定してください'),
  ],
  StatsController.getPrefectureAllWordsStats
);

/**
 * @route GET /api/stats/map/:wordId/clusters
 * @desc 特定語の地域クラスター分析を取得
 * @access Public
 * @param wordId 語のID
 */
router.get(
  '/:wordId/clusters',
  [
    param('wordId')
      .isInt({ min: 1 })
      .withMessage('有効な語IDを指定してください'),
  ],
  StatsController.getAccentClusters
);

/**
 * @route GET /api/stats/map/regional/trends
 * @desc 地域別アクセント傾向を取得
 * @access Public
 * @query region 地域名（北海道、東北、関東、中部、近畿、中国、四国、九州）
 */
router.get(
  '/regional/trends',
  [
    query('region')
      .optional()
      .isIn(['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'])
      .withMessage('有効な地域名を指定してください'),
  ],
  StatsController.getRegionalTrends
);

export default router;