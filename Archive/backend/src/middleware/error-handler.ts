import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * エラーレスポンスの型定義
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * エラーハンドリングミドルウェア
 * すべてのエラーを捕捉し、統一されたレスポンス形式で返す
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // エラーログを記録
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // DomainErrorの場合
  if (err instanceof DomainError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: getErrorDetails(err),
      },
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // バリデーションエラー（express-validator）
  if (err.name === 'ValidationError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err,
      },
    };

    res.status(400).json(errorResponse);
    return;
  }

  // JSON構文エラー
  if (err instanceof SyntaxError && 'body' in err) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    };

    res.status(400).json(errorResponse);
    return;
  }

  // その他の予期しないエラー
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      details:
        process.env.NODE_ENV === 'production'
          ? undefined
          : { stack: err.stack },
    },
  };

  res.status(500).json(errorResponse);
}

/**
 * エラーの詳細情報を取得
 */
function getErrorDetails(err: DomainError): Record<string, unknown> | undefined {
  const details: Record<string, unknown> = {};

  // エラー種別ごとの詳細情報を追加
  if ('field' in err && err.field) {
    details.field = err.field;
  }
  if ('resource' in err && err.resource) {
    details.resource = err.resource;
  }
  if ('conflictingField' in err && err.conflictingField) {
    details.conflictingField = err.conflictingField;
  }
  if ('rule' in err && err.rule) {
    details.rule = err.rule;
  }
  if ('retryAfter' in err && err.retryAfter) {
    details.retryAfter = err.retryAfter;
  }
  if ('service' in err && err.service) {
    details.service = err.service;
  }
  if ('operation' in err && err.operation) {
    details.operation = err.operation;
  }
  if ('details' in err && err.details) {
    Object.assign(details, err.details);
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * 非同期ハンドラーのラッパー
 * 非同期関数のエラーを自動的にエラーハンドラーに渡す
 */
export function asyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}