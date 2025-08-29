/**
 * カスタムエラークラスの定義
 */

/**
 * 基底エラークラス
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_REQUIRED';
  readonly statusCode = 401;
}

/**
 * 権限エラー
 */
export class AuthorizationError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 403;
}

/**
 * リソースが見つからない
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(
    message: string,
    public readonly resource?: string,
  ) {
    super(message);
  }
}

/**
 * 競合エラー（重複など）
 */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(
    message: string,
    public readonly conflictingField?: string,
  ) {
    super(message);
  }
}

/**
 * ビジネスルール違反
 */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly rule?: string,
  ) {
    super(message);
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
  }
}

/**
 * 外部サービスエラー
 */
export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;

  constructor(
    message: string,
    public readonly service?: string,
  ) {
    super(message);
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends DomainError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(
    message: string,
    public readonly operation?: string,
  ) {
    super(message);
  }
}

/**
 * 内部サーバーエラー
 */
export class InternalServerError extends DomainError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;
}

/**
 * 汎用アプリケーションエラー（後方互換性のため）
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}