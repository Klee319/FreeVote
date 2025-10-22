import { Router } from 'express';
import { PollsController } from '../controllers/polls.controller';
import { StatsAccessController } from '../controllers/stats-access.controller';
import { optionalAuth } from '../middleware/auth';
import commentsRoutes from './comments.routes';

const router = Router();
const pollsController = new PollsController();
const statsAccessController = new StatsAccessController();

// 公開エンドポイント（認証オプショナル）
router.get('/', pollsController.getPolls);
router.get('/:id', optionalAuth, pollsController.getPollById);
router.post('/:id/votes', optionalAuth, pollsController.vote);
router.get('/:id/top-by-prefecture', pollsController.getTopByPrefecture);
router.get('/:id/stats', optionalAuth, pollsController.getStats);
router.get('/:id/share-metadata', pollsController.getShareMetadata);

// シェア関連エンドポイント
router.post('/:id/share-grant-access', optionalAuth, pollsController.grantStatsAccessOnShare);
router.get('/:id/has-stats-access', optionalAuth, pollsController.checkStatsAccess);

// 詳細統計アクセス権限関連エンドポイント（既存）
router.post('/:id/grant-stats-access', optionalAuth, statsAccessController.grantAccess);
router.get('/:id/check-stats-access', optionalAuth, statsAccessController.checkAccess);

// コメント関連エンドポイント
router.use('/:id/comments', commentsRoutes);

export default router;
