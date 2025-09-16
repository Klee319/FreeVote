import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { config } from '../config/env';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

/**
 * JWTペイロードの型定義
 */
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * 認証情報を含む拡張Requestインターフェース
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT認証ミドルウェア
 * JWTトークンを検証し、ユーザー情報をリクエストに追加
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined;

    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const [scheme, headerToken] = authHeader.split(' ');
      if (scheme === 'Bearer' && headerToken) {
        token = headerToken;
      }
    }

    // クッキーからトークンを取得（ヘッダーにない場合）
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('認証が必要です', 401);
    }

    // トークンの検証
    const payload = await authService.verifyAccessToken(token);

    // ユーザー情報をリクエストに追加
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * オプショナル認証ミドルウェア
 * トークンがある場合のみ検証し、ない場合もリクエストを通す
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined;

    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const [scheme, headerToken] = authHeader.split(' ');
      if (scheme === 'Bearer' && headerToken) {
        token = headerToken;
      }
    }

    // クッキーからトークンを取得（ヘッダーにない場合）
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // トークンがない場合はスキップ
    if (!token) {
      next();
      return;
    }

    // トークンの検証
    try {
      const payload = await authService.verifyAccessToken(token);
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // 認証エラーの場合もリクエストは通すが、user情報は付与しない
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * ロールベースアクセス制御ミドルウェア
 * 指定されたロール以上の権限を持つユーザーのみアクセス可能
 */
export function authorize(...allowedRoles: string[]): 
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    console.log('[DEBUG] authorize - DISABLE_AUTH:', process.env.DISABLE_AUTH);
    console.log('[DEBUG] authorize - allowedRoles:', allowedRoles);
    
    // 開発環境で認証を無効化
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('[DEBUG] authorize - Setting dev-user for disabled auth');
      req.user = { id: 'dev-user', role: 'admin' } as any;
      next();
      return;
    }
    
    // 認証チェック
    if (!req.user) {
      next(new AppError('認証が必要です', 401));
      return;
    }

    // ロール階層の定義
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      moderator: 2,
      user: 1,
    };

    // ユーザーのロールレベルを取得
    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    
    // 許可されたロールの最小レベルを取得
    const minRequiredLevel = Math.min(
      ...allowedRoles.map((role) => roleHierarchy[role] || 0),
    );

    // 権限チェック
    if (userRoleLevel < minRequiredLevel) {
      next(new AppError('権限が不足しています', 403));
      return;
    }

    next();
  };
}

/**
 * 管理者権限チェックミドルウェア
 */
export const requireAdmin = authorize('admin');

/**
 * モデレーター以上の権限チェックミドルウェア
 */
export const requireModerator = authorize('moderator', 'admin');

/**
 * ログインユーザー権限チェックミドルウェア
 */
export const requireAuth = authorize('user', 'moderator', 'admin');

/**
 * 特定ロール権限チェックミドルウェア
 */
export const requireRole = (role: string) => authorize(role);