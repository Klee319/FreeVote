export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'リソースが見つかりません') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'リクエスト回数の上限に達しました') {
    super(message, 429);
  }
}

// エイリアスとして ApiError を追加
export class ApiError extends AppError {
  constructor(statusCode: number, message: string) {
    super(message, statusCode);
  }
}