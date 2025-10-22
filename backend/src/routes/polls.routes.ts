import { Router } from 'express';
import { PollsController } from '../controllers/polls.controller';
import { optionalAuth } from '../middleware/auth';
import commentsRoutes from './comments.routes';

const router = Router();
const pollsController = new PollsController();

// 公開エンドポイント（認証オプショナル）
router.get('/', pollsController.getPolls);
router.get('/:id', optionalAuth, pollsController.getPollById);
router.post('/:id/votes', optionalAuth, pollsController.vote);
router.get('/:id/top-by-prefecture', pollsController.getTopByPrefecture);
router.get('/:id/stats', pollsController.getStats);

// コメント関連エンドポイント
router.use('/:id/comments', commentsRoutes);

export default router;
