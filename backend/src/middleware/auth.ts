import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface JwtPayload {
  userId: string;
  email?: string;
  isAdmin: boolean;
}

// Express Request型を拡張
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// JWTトークンの検証
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (error) {
    throw new AuthenticationError('無効なトークンです');
  }
}

// 認証ミドルウェア
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('認証トークンが必要です');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isAdmin: true },
    });

    if (!user) {
      throw new AuthenticationError('ユーザーが見つかりません');
    }

    req.user = {
      userId: user.id,
      email: user.email || undefined,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: 'AUTHENTICATION_ERROR',
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          message: '認証に失敗しました',
          code: 'AUTHENTICATION_ERROR',
        },
      });
    }
  }
}

// 管理者権限確認ミドルウェア
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // まず認証を確認
    if (!req.user) {
      await authenticate(req, res, () => {});
    }

    if (!req.user?.isAdmin) {
      throw new AuthorizationError('管理者権限が必要です');
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({
        success: false,
        error: {
          message: error.message,
          code: 'AUTHORIZATION_ERROR',
        },
      });
    } else {
      next(error);
    }
  }
}

// オプショナル認証ミドルウェア（認証なしでも通過可能）
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, isAdmin: true },
      });

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email || undefined,
          isAdmin: user.isAdmin,
        };
      }
    }

    next();
  } catch (error) {
    // エラーが発生しても認証なしとして続行
    next();
  }
}

// エイリアスとしてauthenticateTokenをエクスポート
export const authenticateToken = authenticate;