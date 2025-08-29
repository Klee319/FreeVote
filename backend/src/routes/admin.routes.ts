import { Router } from 'express';
import { authMiddleware, requireModerator, requireAdmin } from '../middleware/auth';

const router = Router();

// 管理者ルートは全て認証必須
router.use(authMiddleware);

/**
 * @route GET /api/admin/submissions
 * @desc 投稿一覧取得
 * @access Moderator
 */
router.get('/submissions', requireModerator, async (req, res) => {
  // TODO: 実装
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

/**
 * @route PUT /api/admin/submissions/:id/approve
 * @desc 投稿承認
 * @access Moderator
 */
router.put('/submissions/:id/approve', requireModerator, async (req, res) => {
  // TODO: 実装
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

/**
 * @route PUT /api/admin/submissions/:id/reject
 * @desc 投稿却下
 * @access Moderator
 */
router.put('/submissions/:id/reject', requireModerator, async (req, res) => {
  // TODO: 実装
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

/**
 * @route GET /api/admin/users
 * @desc ユーザー一覧取得
 * @access Admin
 */
router.get('/users', requireAdmin, async (req, res) => {
  // TODO: 実装
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

/**
 * @route GET /api/admin/audit-logs
 * @desc 監査ログ取得
 * @access Admin
 */
router.get('/audit-logs', requireAdmin, async (req, res) => {
  // TODO: 実装
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });
});

export default router;