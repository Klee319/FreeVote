import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// 公開エンドポイント
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/social-login', authController.socialLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// 認証が必要なエンドポイント
router.get('/me', authenticate, authController.getMe);

export default router;