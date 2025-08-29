import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * バリデーション結果をチェックするミドルウェア
 */
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().reduce((acc, error) => {
      if ('path' in error) {
        acc[error.path] = error.msg;
      }
      return acc;
    }, {} as Record<string, string>);

    next(new ValidationError('Validation failed', undefined, errorDetails));
    return;
  }
  
  next();
}

/**
 * 共通のバリデーションルール
 */
export const commonValidations = {
  // ID系
  wordId: param('id')
    .isInt({ min: 1 })
    .withMessage('Word ID must be a positive integer')
    .toInt(),

  voteId: param('id')
    .isInt({ min: 1 })
    .withMessage('Vote ID must be a positive integer')
    .toInt(),

  submissionId: param('id')
    .isInt({ min: 1 })
    .withMessage('Submission ID must be a positive integer')
    .toInt(),

  // ページネーション
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // 都道府県コード
  prefectureCode: body('prefecture')
    .matches(/^(0[1-9]|[1-3][0-9]|4[0-7])$/)
    .withMessage('Invalid prefecture code'),

  // 年代
  ageGroup: body('ageGroup')
    .optional()
    .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
    .withMessage('Invalid age group'),
};

/**
 * 語検索のバリデーション
 */
export const searchWordsValidation: ValidationChain[] = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
  
  query('category')
    .optional()
    .isIn(['general', 'technical', 'dialect', 'proper_noun'])
    .withMessage('Invalid category'),
  
  query('sort')
    .optional()
    .isIn(['latest', 'popular', 'alphabetic'])
    .withMessage('Invalid sort option'),
  
  ...commonValidations.pagination,
];

/**
 * 投票送信のバリデーション
 */
export const submitVoteValidation: ValidationChain[] = [
  body('wordId')
    .isInt({ min: 1 })
    .withMessage('Word ID must be a positive integer')
    .toInt(),
  
  body('accentTypeId')
    .isInt({ min: 1 })
    .withMessage('Accent type ID must be a positive integer')
    .toInt(),
  
  commonValidations.prefectureCode,
  commonValidations.ageGroup,
  
  body('turnstileToken')
    .notEmpty()
    .withMessage('Turnstile token is required'),
];

/**
 * 新語投稿のバリデーション
 */
export const submitWordValidation: ValidationChain[] = [
  body('headword')
    .notEmpty()
    .withMessage('Headword is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Headword must be between 1 and 100 characters'),
  
  body('reading')
    .notEmpty()
    .withMessage('Reading is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Reading must be between 1 and 200 characters')
    .matches(/^[ァ-ヴー]+$/)
    .withMessage('Reading must be in katakana'),
  
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
    .toInt(),
  
  body('aliases')
    .optional()
    .isArray()
    .withMessage('Aliases must be an array')
    .bail()
    .custom((aliases: string[]) => {
      return aliases.every((alias) => typeof alias === 'string' && alias.length <= 100);
    })
    .withMessage('Each alias must be a string with maximum 100 characters'),
  
  body('initialAccentType')
    .isIn(['atamadaka', 'heiban', 'nakadaka', 'odaka'])
    .withMessage('Invalid accent type'),
  
  commonValidations.prefectureCode,
  commonValidations.ageGroup,
  
  body('turnstileToken')
    .notEmpty()
    .withMessage('Turnstile token is required'),
];

/**
 * 管理者による承認/却下のバリデーション
 */
export const moderationValidation: ValidationChain[] = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  
  body('comment')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Comment is required when rejecting')
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comment must be maximum 500 characters'),
];

/**
 * ランキング取得のバリデーション
 */
export const rankingValidation: ValidationChain[] = [
  query('window')
    .optional()
    .isIn(['7d', '30d', 'all'])
    .withMessage('Invalid window period'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('category')
    .optional()
    .isIn(['general', 'technical', 'dialect', 'proper_noun'])
    .withMessage('Invalid category'),
];

/**
 * 統計トレンド取得のバリデーション
 */
export const trendsValidation: ValidationChain[] = [
  query('wordId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Word ID must be a positive integer')
    .toInt(),
  
  query('prefecture')
    .optional()
    .matches(/^(0[1-9]|[1-3][0-9]|4[0-7])$/)
    .withMessage('Invalid prefecture code'),
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period'),
  
  query('granularity')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid granularity'),
];

/**
 * ユーザー登録のバリデーション
 */
export const signupValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('displayName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  
  body('prefecture')
    .optional()
    .matches(/^(0[1-9]|[1-3][0-9]|4[0-7])$/)
    .withMessage('Invalid prefecture code'),
  
  body('ageGroup')
    .optional()
    .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
    .withMessage('Invalid age group'),
  
  body('turnstileToken')
    .notEmpty()
    .withMessage('Turnstile token is required'),
];

/**
 * ログインのバリデーション
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('turnstileToken')
    .notEmpty()
    .withMessage('Turnstile token is required'),
];