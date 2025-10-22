import { Router } from 'express';
import { CommentsController } from '../controllers/comments.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router({ mergeParams: true }); // 親ルーターのparamsを継承
const commentsController = new CommentsController();

// コメント関連エンドポイント（認証オプショナル）
router.get('/', commentsController.getComments);
router.post('/', optionalAuth, commentsController.createComment);
router.post('/:commentId/like', optionalAuth, commentsController.likeComment);
router.delete('/:commentId', optionalAuth, commentsController.deleteComment);

export default router;
