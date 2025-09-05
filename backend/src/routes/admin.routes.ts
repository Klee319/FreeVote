import { Router } from 'express';
import { authMiddleware, requireModerator, requireAdmin } from '../middleware/auth';
import { AdminController } from '../controllers/admin.controller';
import { body, query, param } from 'express-validator';
import { validationMiddleware } from '../middleware/validation';

const router = Router();

// 管理者ルートは全て認証必須
router.use(authMiddleware);

/**
 * @route POST /api/admin/database/reset
 * @desc データベースリセット（全データ削除）
 * @access Admin
 */
router.post('/database/reset', requireAdmin, AdminController.resetDatabase.bind(AdminController));

/**
 * @route GET /api/admin/database/stats
 * @desc データベース統計情報取得
 * @access Admin
 */
router.get('/database/stats', requireAdmin, AdminController.getDatabaseStats.bind(AdminController));

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
router.get('/users', requireAdmin, AdminController.getUsers.bind(AdminController));

/**
 * @route PUT /api/admin/users/:id/role
 * @desc ユーザーロール更新
 * @access Admin
 */
router.put('/users/:id/role', requireAdmin, AdminController.updateUserRole.bind(AdminController));

/**
 * @route GET /api/admin/audit-logs
 * @desc 監査ログ取得
 * @access Admin
 */
router.get('/audit-logs', requireAdmin, AdminController.getAuditLogs.bind(AdminController));

export default router;