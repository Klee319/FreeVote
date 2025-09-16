import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';
import { CookieAuthService, COOKIE_OPTIONS } from '../services/cookie-auth.service';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();
const cookieAuthService = new CookieAuthService(prisma);

/**
 * 拡張されたRequestインターフェース
 */
export interface AuthenticatedRequest extends Request {
  anonymousUser?: {
    deviceId: string;
    ageGroup: string;
    gender: string;
    prefectureCode: string;
    registeredAt: Date;
    lastActiveAt: Date;
  };
  deviceFingerprint?: string;
}

/**
 * Cookie認証ミドルウェア
 * Cookieを検証し、匿名ユーザー情報をリクエストに付加
 */
export const cookieAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Cookieを取得
    const cookieValue = req.cookies?.[COOKIE_OPTIONS.name];

    if (cookieValue) {
      // Cookieを検証
      const user = await cookieAuthService.verifyCookie(cookieValue);

      if (user) {
        // ユーザー情報をリクエストに付加
        req.anonymousUser = {
          deviceId: user.deviceId,
          ageGroup: user.ageGroup,
          gender: user.gender,
          prefectureCode: user.prefectureCode,
          registeredAt: user.registeredAt,
          lastActiveAt: user.lastActiveAt,
        };

        // セッションをリフレッシュ（最終アクセス時間更新）
        const { cookie } = await cookieAuthService.refreshSession(user.deviceId);
        
        // 新しいCookieを設定
        res.cookie(COOKIE_OPTIONS.name, cookie, {
          httpOnly: COOKIE_OPTIONS.httpOnly,
          secure: COOKIE_OPTIONS.secure,
          sameSite: COOKIE_OPTIONS.sameSite,
          maxAge: COOKIE_OPTIONS.maxAge,
          path: COOKIE_OPTIONS.path,
        });
      }
    }

    // デバイスフィンガープリントを生成
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    req.deviceFingerprint = cookieAuthService.generateDeviceFingerprint(
      userAgent,
      acceptLanguage,
      acceptEncoding
    );

    next();
  } catch (error) {
    console.error('Cookie authentication middleware error:', error);
    next(); // エラーが発生しても処理を継続
  }
};

/**
 * 匿名ユーザー登録必須ミドルウェア
 * 匿名ユーザーが登録されていない場合はエラーを返す
 */
export const requireAnonymousAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.anonymousUser) {
    throw new AppError('Anonymous registration required', 401);
  }
  next();
};

/**
 * CSRF保護ミドルウェア
 * CSRFトークンを検証
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 読み取り専用メソッドはCSRF対象外
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || !headerToken) {
    throw new AppError('CSRF token missing', 403);
  }

  // タイミング攻撃対策付き比較
  if (!safeCompare(cookieToken, headerToken as string)) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};

/**
 * タイミング攻撃対策付き文字列比較
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRFトークンを生成
 */
export const generateCSRFToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRFトークンをCookieに設定
 */
export const setCSRFTokenCookie = (res: Response): string => {
  const token = generateCSRFToken();
  
  res.cookie('csrf-token', token, {
    httpOnly: false, // JavaScriptからアクセス可能にする
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    path: '/',
  });
  
  return token;
};