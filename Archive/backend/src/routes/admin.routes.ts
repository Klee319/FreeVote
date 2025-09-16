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

/**
 * @route GET /api/admin/words
 * @desc 単語一覧取得（管理者用）
 * @access Admin
 */
router.get('/words', requireAdmin, AdminController.getWords.bind(AdminController));

/**
 * @route POST /api/admin/words
 * @desc 単語作成
 * @access Admin
 */
router.post('/words', requireAdmin, AdminController.createWord.bind(AdminController));

/**
 * @route PUT /api/admin/words/:id
 * @desc 単語更新
 * @access Admin
 */
router.put('/words/:id', requireAdmin, AdminController.updateWord.bind(AdminController));

/**
 * @route DELETE /api/admin/words/:id
 * @desc 単語削除
 * @access Admin
 */
router.delete('/words/:id', requireAdmin, AdminController.deleteWord.bind(AdminController));

/**
 * @route POST /api/admin/words/import
 * @desc JSON一括インポート
 * @access Admin
 */
router.post('/words/import', requireAdmin, AdminController.importWords.bind(AdminController));

/**
 * @route GET /api/admin/stats/overview
 * @desc 投票統計概要取得
 * @access Admin
 */
router.get('/stats/overview', requireAdmin, AdminController.getVoteStats.bind(AdminController));

/**
 * @route GET /api/admin/polls
 * @desc 投票一覧取得（管理者用）
 * @access Admin
 */
router.get('/polls', requireAdmin, AdminController.getPolls.bind(AdminController));

/**
 * @route POST /api/admin/polls
 * @desc 投票作成（管理者用）
 * @access Admin
 */
router.post('/polls', requireAdmin, AdminController.createPoll.bind(AdminController));

/**
 * @route PUT /api/admin/polls/:id
 * @desc 投票更新（管理者用）
 * @access Admin
 */
router.put('/polls/:id', requireAdmin, AdminController.updatePoll.bind(AdminController));

/**
 * @route DELETE /api/admin/polls/:id
 * @desc 投票削除（管理者用）
 * @access Admin
 */
router.delete('/polls/:id', requireAdmin, AdminController.deletePoll.bind(AdminController));

export default router;