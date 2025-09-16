import { Router } from 'express';
import { ShareController } from '../controllers/shares.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const shareController = new ShareController();

// シェア活動を記録（認証必須）
router.post('/track/:pollId', authenticate, (req, res, next) =>
  shareController.trackShare(req, res, next)
);

// シェアランキングを取得（公開API）
router.get('/ranking', (req, res, next) =>
  shareController.getRanking(req, res, next)
);

// 自分のシェア統計を取得（認証必須）
router.get('/my-stats', authenticate, (req, res, next) =>
  shareController.getMyStats(req, res, next)
);

// 特定ユーザーのシェア統計を取得（公開API）
router.get('/user/:userId', (req, res, next) =>
  shareController.getUserStats(req, res, next)
);

export default router;