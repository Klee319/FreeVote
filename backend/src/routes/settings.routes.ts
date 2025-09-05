import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// アプリケーション設定の取得
router.get('/', settingsController.getSettings);

// 特定の設定を更新
router.put('/:key', settingsController.updateSetting);

// 複数の設定を一括更新
router.put('/', settingsController.updateSettings);

// 設定をデフォルトにリセット
router.post('/reset', settingsController.resetSettings);

export default router;