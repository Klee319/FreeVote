import { Router } from 'express';
import usersController, { uploadMiddleware } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 認証が必要なエンドポイント
router.use(authenticateToken);

// GET /api/users/profile - 自分のプロフィール取得（拡張版）
router.get('/profile', usersController.getProfile);

// PATCH /api/users/profile - プロフィール更新
router.patch('/profile', usersController.updateProfile);

// PATCH /api/users/status - ステータス変更（年1回制限）
router.patch('/status', usersController.updateStatus);

// GET /api/users/status/check - ステータス変更可能かチェック
router.get('/status/check', usersController.checkStatusChangeEligibility);

// POST /api/users/avatar - アバター画像アップロード
router.post('/avatar', uploadMiddleware, usersController.uploadAvatar);

// GET /api/users/vote-history - 投票履歴取得
router.get('/vote-history', usersController.getVoteHistory);

// GET /api/users/stats - ユーザー統計取得
router.get('/stats', usersController.getUserStats);

// POST /api/users/link-sns - SNS連携
router.post('/link-sns', usersController.linkSns);

// DELETE /api/users/unlink-sns/:platform - SNS連携解除
router.delete('/unlink-sns/:platform', usersController.unlinkSns);

export default router;