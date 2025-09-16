/**
 * APIルーティング設定
 */

import { Router } from 'express';
import wordsRoutes from './words.routes';
import votesRoutes from './votes.routes';
import rankingRoutes from './ranking.routes';
import authRoutes from './auth.routes';
// import adminRoutes from './admin.routes'; // TODO: 一時的に無効化
import statsRoutes from './stats.routes';
import masterRoutes from './master.routes';
import mapRoutes from './map.routes';
import settingsRoutes from './settings.routes';
import pollsRoutes from './polls.routes';

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

// 地図統計関連
router.use('/stats/map', mapRoutes);

// マスタデータ関連
router.use('/', masterRoutes);

// 管理者関連（認証必須）
// TODO: AdminController修正まで一時的に無効化
// router.use('/admin', adminRoutes);

// 設定値管理
router.use('/settings', settingsRoutes);

// 汎用投票関連
router.use('/polls', pollsRoutes);

export default router;