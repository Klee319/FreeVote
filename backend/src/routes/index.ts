/**
 * APIルーティング設定
 */

import { Router } from 'express';
import wordsRoutes from './words.routes';
import votesRoutes from './votes.routes';
import rankingRoutes from './ranking.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import statsRoutes from './stats.routes';
import masterRoutes from './master.routes';

const router = Router();

/**
 * APIルート設定
 */

// 認証関連
router.use('/auth', authRoutes);

// 語関連
router.use('/words', wordsRoutes);

// 投票関連
router.use('/votes', votesRoutes);

// ランキング関連
router.use('/ranking', rankingRoutes);

// 統計関連
router.use('/stats', statsRoutes);

// マスタデータ関連
router.use('/', masterRoutes);

// 管理者関連（認証必須）
router.use('/admin', adminRoutes);

export default router;