import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { CookieAuthService, COOKIE_OPTIONS, AnonymousUserData } from '../services/cookie-auth.service';
import { AuthenticatedRequest, setCSRFTokenCookie } from '../middleware/cookie-auth';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();
const cookieAuthService = new CookieAuthService(prisma);

export class AuthController {
  /**
   * 匿名ユーザー登録
   */
  static anonymousRegisterValidation = [
    body('age')
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .withMessage('有効な年齢層を指定してください'),
    body('gender')
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('有効な性別を指定してください'),
    body('prefecture')
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
  ];

  static async anonymousRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const { age, gender, prefecture } = req.body as AnonymousUserData;

      // 匿名ユーザーを登録
      const { deviceId, cookie, user } = await cookieAuthService.registerAnonymousUser({
        age,
        gender,
        prefecture,
      });

      // Cookieを設定
      res.cookie(COOKIE_OPTIONS.name, cookie, {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        maxAge: COOKIE_OPTIONS.maxAge,
        path: COOKIE_OPTIONS.path,
      });

      // CSRFトークンを設定
      const csrfToken = setCSRFTokenCookie(res);

      res.status(201).json({
        success: true,
        data: {
          deviceId,
          user: {
            deviceId: user.deviceId,
            ageGroup: user.ageGroup,
            gender: user.gender,
            prefectureCode: user.prefectureCode,
            prefecture: user.prefecture,
            registeredAt: user.registeredAt,
            lastActiveAt: user.lastActiveAt,
          },
          csrfToken,
        },
        message: '匿名ユーザーとして登録されました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cookie検証
   */
  static async verifyCookie(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cookieValue = req.cookies?.[COOKIE_OPTIONS.name];

      if (!cookieValue) {
        // CSRFトークンを設定（新規ユーザー用）
        const csrfToken = setCSRFTokenCookie(res);
        
        res.status(200).json({
          success: true,
          requiresRegistration: true,
          csrfToken,
          message: '登録が必要です',
        });
        return;
      }

      const user = await cookieAuthService.verifyCookie(cookieValue);

      if (!user) {
        // CSRFトークンを設定（期限切れユーザー用）
        const csrfToken = setCSRFTokenCookie(res);
        
        res.status(200).json({
          success: true,
          requiresRegistration: true,
          csrfToken,
          message: 'Cookieが無効または期限切れです',
        });
        return;
      }

      // セッションをリフレッシュ
      const { cookie } = await cookieAuthService.refreshSession(user.deviceId);

      // 新しいCookieを設定
      res.cookie(COOKIE_OPTIONS.name, cookie, {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        maxAge: COOKIE_OPTIONS.maxAge,
        path: COOKIE_OPTIONS.path,
      });

      // CSRFトークンを設定
      const csrfToken = setCSRFTokenCookie(res);

      res.status(200).json({
        success: true,
        requiresRegistration: false,
        user: {
          deviceId: user.deviceId,
          ageGroup: user.ageGroup,
          gender: user.gender,
          prefectureCode: user.prefectureCode,
          prefecture: user.prefecture,
          registeredAt: user.registeredAt,
          lastActiveAt: user.lastActiveAt,
        },
        csrfToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * セッションリフレッシュ
   */
  static async refreshSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.anonymousUser) {
        throw new AppError('認証が必要です', 401);
      }

      const { cookie, user } = await cookieAuthService.refreshSession(req.anonymousUser.deviceId);

      // 新しいCookieを設定
      res.cookie(COOKIE_OPTIONS.name, cookie, {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        maxAge: COOKIE_OPTIONS.maxAge,
        path: COOKIE_OPTIONS.path,
      });

      res.status(200).json({
        success: true,
        message: 'セッションがリフレッシュされました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 属性更新
   */
  static updateAttributesValidation = [
    body('age')
      .optional()
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .withMessage('有効な年齢層を指定してください'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('有効な性別を指定してください'),
    body('prefecture')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
  ];

  static async updateAttributes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      if (!req.anonymousUser) {
        throw new AppError('認証が必要です', 401);
      }

      const { age, gender, prefecture } = req.body;

      const { user, cookie } = await cookieAuthService.updateAnonymousUser(
        req.anonymousUser.deviceId,
        { age, gender, prefecture }
      );

      // 新しいCookieを設定
      res.cookie(COOKIE_OPTIONS.name, cookie, {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        maxAge: COOKIE_OPTIONS.maxAge,
        path: COOKIE_OPTIONS.path,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            deviceId: user.deviceId,
            ageGroup: user.ageGroup,
            gender: user.gender,
            prefectureCode: user.prefectureCode,
            prefecture: user.prefecture,
            registeredAt: user.registeredAt,
            lastActiveAt: user.lastActiveAt,
          },
        },
        message: '属性が更新されました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ログアウト（Cookie削除）
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Cookieをクリア
      res.clearCookie(COOKIE_OPTIONS.name);
      res.clearCookie('csrf-token');

      res.status(200).json({
        success: true,
        message: 'ログアウトしました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 現在のユーザー情報取得
   */
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.anonymousUser) {
        res.status(200).json({
          success: true,
          requiresRegistration: true,
          message: '登録が必要です',
        });
        return;
      }

      const user = await cookieAuthService.getAnonymousUser(req.anonymousUser.deviceId);

      if (!user) {
        res.status(200).json({
          success: true,
          requiresRegistration: true,
          message: 'ユーザーが見つかりません',
        });
        return;
      }

      res.status(200).json({
        success: true,
        requiresRegistration: false,
        data: {
          user: {
            deviceId: user.deviceId,
            ageGroup: user.ageGroup,
            gender: user.gender,
            prefectureCode: user.prefectureCode,
            prefecture: user.prefecture,
            registeredAt: user.registeredAt,
            lastActiveAt: user.lastActiveAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}