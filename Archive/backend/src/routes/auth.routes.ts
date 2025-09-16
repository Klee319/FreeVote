import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { cookieAuthMiddleware, requireAnonymousAuth, csrfProtection } from '../middleware/cookie-auth';

const router = Router();

/**
 * @route POST /api/auth/anonymous-register
 * @desc 匿名ユーザー登録
 * @access Public
 */
router.post(
  '/anonymous-register',
  AuthController.anonymousRegisterValidation,
  AuthController.anonymousRegister
);

/**
 * @route GET /api/auth/verify-cookie
 * @desc Cookie検証
 * @access Public
 */
router.get(
  '/verify-cookie',
  cookieAuthMiddleware,
  AuthController.verifyCookie
);

/**
 * @route PUT /api/auth/refresh-session
 * @desc セッションリフレッシュ
 * @access Private (Anonymous)
 */
router.put(
  '/refresh-session',
  cookieAuthMiddleware,
  requireAnonymousAuth,
  csrfProtection,
  AuthController.refreshSession
);

/**
 * @route PUT /api/auth/attributes
 * @desc 属性更新
 * @access Private (Anonymous)
 */
router.put(
  '/attributes',
  cookieAuthMiddleware,
  requireAnonymousAuth,
  csrfProtection,
  AuthController.updateAttributesValidation,
  AuthController.updateAttributes
);

/**
 * @route POST /api/auth/logout
 * @desc ログアウト
 * @access Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route GET /api/auth/me
 * @desc 現在のユーザー情報取得
 * @access Public (Anonymous allowed)
 */
router.get('/me', cookieAuthMiddleware, AuthController.getMe);

export default router;