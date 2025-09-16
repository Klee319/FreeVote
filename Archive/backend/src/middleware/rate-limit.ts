import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';
import { Request, Response } from 'express';

/**
 * レート制限の設定インターフェース
 */
interface RateLimitConfig {
  windowMs: number; // 時間枠（ミリ秒）
  max: number; // 最大リクエスト数
  message?: string; // エラーメッセージ
  skipSuccessfulRequests?: boolean; // 成功リクエストをカウントしない
  skipFailedRequests?: boolean; // 失敗リクエストをカウントしない
}

/**
 * カスタムエラーハンドラー
 */
const customHandler = (req: Request, res: Response): void => {
  const error = new RateLimitError('Too many requests, please try again later', 60);
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: {
        retryAfter: error.retryAfter,
      },
    },
  });
};

/**
 * デフォルトのレート制限（全体）
 * 1分間に60リクエストまで
 */
export const defaultRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => {
    // IPアドレスとユーザーIDを組み合わせてキーを生成
    const ip = req.ip ?? 'unknown';
    const userId = (req as any).user?.id?.toString() ?? 'anonymous';
    return `${ip}:${userId}`;
  },
});

/**
 * 検索APIのレート制限
 * 1分間に60リクエストまで
 */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => req.ip ?? 'unknown',
});

/**
 * 投票APIのレート制限
 * 1時間に10リクエストまで
 */
export const voteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => req.ip ?? 'unknown',
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // 失敗した投票はカウントしない
});

/**
 * 新語投稿APIのレート制限
 * 1時間に3リクエストまで
 */
export const submitWordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => {
    // ユーザーIDベースでレート制限（ログイン必須機能のため）
    const userId = (req as any).user?.id?.toString();
    if (!userId) {
      return req.ip ?? 'unknown';
    }
    return userId;
  },
});

/**
 * 認証APIのレート制限
 * 15分間に5リクエストまで
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => {
    // IPアドレスとメールアドレスの組み合わせ
    const ip = req.ip ?? 'unknown';
    const email = req.body?.email ?? 'unknown';
    return `${ip}:${email}`;
  },
  skipSuccessfulRequests: true, // 成功したログインはカウントしない
});

/**
 * 管理APIのレート制限
 * 1分間に30リクエストまで
 */
export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler,
  keyGenerator: (req: Request): string => {
    // 管理者のユーザーIDベース
    const userId = (req as any).user?.id?.toString();
    return userId ?? req.ip ?? 'unknown';
  },
});

/**
 * カスタムレート制限を作成
 */
export function createRateLimit(config: RateLimitConfig): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: customHandler,
    skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
    skipFailedRequests: config.skipFailedRequests ?? false,
  });
}