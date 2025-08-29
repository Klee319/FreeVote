/**
 * 語関連ルーティング
 */

import { Router } from 'express';
import { wordsController } from '../controllers/words.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();

/**
 * GET /api/words
 * 語の検索・一覧取得
 */
router.get('/',
  [
    query('q').optional().isString().trim(),
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['latest', 'popular', 'alphabetic'])
  ],
  validateRequest,
  (req, res, next) => wordsController.searchWords(req, res, next)
);

/**
 * GET /api/words/recent
 * 新着語一覧取得
 */
router.get('/recent',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  (req, res, next) => wordsController.getRecentWords(req, res, next)
);

/**
 * GET /api/words/:id
 * 語の詳細取得
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 })
  ],
  validateRequest,
  (req, res, next) => wordsController.getWordDetail(req, res, next)
);

/**
 * GET /api/words/:id/stats
 * 都道府県別統計取得
 */
router.get('/:id/stats',
  [
    param('id').isInt({ min: 1 }),
    query('prefecture').optional().isString().isLength({ min: 2, max: 2 })
  ],
  validateRequest,
  (req, res, next) => wordsController.getWordStats(req, res, next)
);

/**
 * POST /api/words
 * 新語投稿（認証必須）
 */
router.post('/',
  authMiddleware,
  [
    body('headword').notEmpty().isString().isLength({ max: 100 }),
    body('reading').notEmpty().isString().isLength({ max: 200 })
      .matches(/^[ァ-ヶー]+$/).withMessage('読みはカタカナで入力してください'),
    body('categoryId').notEmpty().isInt({ min: 1 }),
    body('aliases').optional().isArray(),
    body('aliases.*').optional().isString().isLength({ max: 100 }),
    body('initialAccentType').notEmpty().isString()
      .isIn(['atamadaka', 'heiban', 'nakadaka', 'odaka']),
    body('prefecture').notEmpty().isString().isLength({ min: 2, max: 2 }),
    body('ageGroup').optional().isString()
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+']),
    body('turnstileToken').notEmpty().isString()
  ],
  validateRequest,
  (req, res, next) => wordsController.submitWord(req, res, next)
);

export default router;