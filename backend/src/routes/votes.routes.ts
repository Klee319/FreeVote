import { Router } from 'express';
import { VotesController } from '../controllers/votes.controller';

const router = Router();

/**
 * @route POST /api/votes
 * @desc 投票を作成
 * @access Public
 */
router.post(
  '/',
  VotesController.createVoteValidation,
  VotesController.createVote
);

/**
 * @route GET /api/votes/user
 * @desc ユーザーの投票履歴を取得
 * @access Public/Private
 */
router.get(
  '/user',
  VotesController.getUserVotesValidation,
  VotesController.getUserVotes
);

/**
 * @route GET /api/votes/word/:wordId
 * @desc 特定の語に対するユーザーの投票を取得
 * @access Public
 */
router.get(
  '/word/:wordId',
  VotesController.getUserVoteForWordValidation,
  VotesController.getUserVoteForWord
);

/**
 * @route GET /api/votes/stats/:wordId
 * @desc 投票統計を取得
 * @access Public
 */
router.get(
  '/stats/:wordId',
  VotesController.getVoteStatsValidation,
  VotesController.getVoteStats
);

/**
 * @route DELETE /api/votes/:id
 * @desc 投票を取り消し
 * @access Public
 */
router.delete(
  '/:id',
  VotesController.deleteVoteValidation,
  VotesController.deleteVote
);

export default router;