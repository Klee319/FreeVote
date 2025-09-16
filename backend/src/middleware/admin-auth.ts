import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/errors";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@example.com").split(",");

interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * 管理者認証ミドルウェア
 * JWTトークンの検証と管理者権限のチェックを行う
 */
export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "認証トークンが必要です");
    }

    const token = authHeader.substring(7);

    // トークンを検証
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 管理者権限をチェック
    if (decoded.role !== "admin" && !ADMIN_EMAILS.includes(decoded.email)) {
      throw new ApiError(403, "管理者権限が必要です");
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, "無効な認証トークンです"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, "認証トークンの有効期限が切れています"));
    } else {
      next(error);
    }
  }
};

/**
 * オプショナル管理者認証ミドルウェア
 * トークンがある場合は検証するが、なくても続行する
 */
export const optionalAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 管理者権限をチェック
    if (decoded.role === "admin" || ADMIN_EMAILS.includes(decoded.email)) {
      req.user = decoded;
    }

    next();
  } catch (error) {
    // トークンが無効でも続行
    next();
  }
};

/**
 * 開発環境用の管理者認証ミドルウェア
 * 開発環境では認証をスキップする
 */
export const devAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === "development") {
    // 開発環境ではデフォルトの管理者として扱う
    req.user = {
      id: "dev-admin",
      email: "admin@dev.com",
      role: "admin",
    };
    return next();
  }

  // 本番環境では通常の認証を行う
  return adminAuth(req, res, next);
};