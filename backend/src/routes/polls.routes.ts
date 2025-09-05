import { Router } from 'express';
import { PollsController } from '../controllers/polls.controller';

const router = Router();

// 公開中の投票一覧を取得
router.get(
  '/',
  PollsController.getPollsValidation,
  PollsController.getPolls
);

// 投票詳細を取得
router.get(
  '/:id',
  PollsController.getPollDetailValidation,
  PollsController.getPollDetail
);

// 新規投票を作成（管理者のみ）
router.post(
  '/',
  PollsController.createPollValidation,
  PollsController.createPoll
);

// 投票を実行
router.post(
  '/:id/votes',
  PollsController.submitVoteValidation,
  PollsController.submitVote
);

// 投票統計を取得
router.get(
  '/:id/stats',
  PollsController.getPollStatsValidation,
  PollsController.getPollStats
);

// 都道府県別トップ票を取得
router.get(
  '/:id/top-by-prefecture',
  PollsController.getPollTopByPrefectureValidation,
  PollsController.getPollTopByPrefecture
);

// 投票リクエスト関連
router.post(
  '/requests',
  PollsController.createVoteRequestValidation,
  PollsController.createVoteRequest
);

router.get(
  '/requests',
  PollsController.getVoteRequestsValidation,
  PollsController.getVoteRequests
);

export default router;