import { Router } from 'express';
import { PollSuggestionsController } from '../controllers/poll-suggestions.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const controller = new PollSuggestionsController();

// 認証ユーザー向けエンドポイント
router.post('/', authenticate, (req, res) => controller.createSuggestion(req, res));
router.get('/my', authenticate, (req, res) => controller.getUserSuggestions(req, res));

// 管理者向けエンドポイント
router.get('/', requireAdmin, (req, res) => controller.getSuggestions(req, res));
router.get('/:id', requireAdmin, (req, res) => controller.getSuggestionById(req, res));
router.patch('/:id', requireAdmin, (req, res) => controller.updateSuggestionStatus(req, res));
router.delete('/:id', requireAdmin, (req, res) => controller.deleteSuggestion(req, res));

export default router;