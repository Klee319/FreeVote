import { Router } from 'express';
import { PollsController } from '../controllers/polls.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const pollsController = new PollsController();

// 公開エンドポイント（認証オプショナル）
router.get('/', pollsController.getPolls);
router.get('/:id', pollsController.getPollById);
router.post('/:id/votes', optionalAuth, pollsController.vote);
router.get('/:id/top-by-prefecture', pollsController.getTopByPrefecture);
router.get('/:id/stats', pollsController.getStats);

export default router;