import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config/env';
import { ZodError } from 'zod';
import { formatZodError } from '../utils/validation';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zodバリデーションエラーの処理
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: formatZodError(err),
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // AppErrorの処理
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.constructor.name,
      },
    });
    return;
  }

  // その他のエラー
  console.error('Unexpected error:', err);

  const statusCode = 500;
  const message = config.isProduction
    ? 'サーバーエラーが発生しました'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(config.isDevelopment && { stack: err.stack }),
    },
  });
}

// 非同期エラーをキャッチするラッパー
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}