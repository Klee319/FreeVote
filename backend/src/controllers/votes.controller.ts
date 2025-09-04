import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { VoteService } from '../services/vote.service';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();
const voteService = new VoteService(prisma);

export class VotesController {
  /**
   * 投票を作成
   */
  static createVoteValidation = [
    body('wordId').isInt({ min: 1 }).withMessage('有効な語IDを指定してください'),
    body('accentTypeId').isInt({ min: 1 }).withMessage('有効なアクセント型IDを指定してください'),
    body('prefectureCode')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('有効な都道府県コードを指定してください'),
    body('ageGroup')
      .optional()
      .isIn(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .withMessage('有効な年齢層を指定してください'),
  ];

  static async createVote(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[VotesController] Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array()
        });
      }

      const { wordId, accentTypeId, prefectureCode, ageGroup } = req.body;

      // デバイスIDをヘッダーから取得
      const deviceId = req.headers['x-device-id'] as string || undefined;

      // IPアドレスとユーザーエージェントを取得
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;

      // ユーザーIDを取得（認証済みの場合）
      const userId = (req as any).user?.id || undefined;

      console.log('[VotesController] Creating vote:', {
        wordId,
        accentTypeId,
        deviceId: deviceId ? 'provided' : 'not provided',
        prefectureCode,
        ageGroup
      });

      const vote = await voteService.submitVote({
        wordId,
        accentTypeId,
        deviceId,
        userId,
        prefectureCode,
        ageGroup,
        ipAddress,
        userAgent,
      });

      // デバッグ：投票後の統計を取得（voteオブジェクトにstatsが含まれている場合はそれを使用）
      const updatedStats = vote.stats || await voteService.getVoteStats(wordId);
      
      console.log('[VotesController] Vote created successfully:', {
        voteId: vote.id,
        wordId,
        accentTypeId: vote.accentTypeId,
        nationalStatsCount: updatedStats.national.length,
        totalVotes: updatedStats.national.reduce((sum, stat) => sum + stat.voteCount, 0),
      });

      res.status(201).json({
        success: true,
        data: vote,
        stats: updatedStats,
        message: '投票が完了しました',
      });
    } catch (error) {
      // エラーログを詳細に出力
      console.error('[VotesController.createVote] Error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
        headers: {
          deviceId: req.headers['x-device-id'],
          userAgent: req.get('user-agent')
        }
      });

      // AppErrorの場合は適切なステータスコードで返す
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
          errors: error.errors || []
        });
      }

      // 予期しないエラーの場合
      res.status(500).json({
        success: false,
        message: '投票処理中にエラーが発生しました',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * 投票を取り消し
   */
  static deleteVoteValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
  ];

  static async deleteVote(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const voteId = parseInt(req.params.id);
      const deviceId = req.body.deviceId || req.headers['x-device-id'] as string;

      if (!deviceId) {
        throw new AppError('デバイスIDが必要です', 400);
      }

      await voteService.cancelVote(voteId, deviceId);

      res.status(200).json({
        success: true,
        message: '投票を取り消しました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザーの投票履歴を取得
   */
  static getUserVotesValidation = [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('有効な取得件数を指定してください'),
    query('offset').optional().isInt({ min: 0 }).withMessage('有効なオフセットを指定してください'),
  ];

  static async getUserVotes(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = (req as any).user?.id;
      const deviceId = req.headers['x-device-id'] as string;

      const votes = await voteService.getUserVoteHistory(
        userId,
        deviceId,
        limit,
        offset
      );

      res.status(200).json({
        success: true,
        data: votes,
        pagination: {
          limit,
          offset,
          count: votes.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 特定の語に対するユーザーの投票を取得
   */
  static getUserVoteForWordValidation = [
    param('wordId').isInt({ min: 1 }).withMessage('有効な語IDを指定してください'),
  ];

  static async getUserVoteForWord(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array()
        });
      }

      const wordId = parseInt(req.params.wordId);
      const deviceId = req.headers['x-device-id'] as string;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'デバイスIDが必要です'
        });
      }

      const vote = await voteService.getUserVoteForWord(wordId, deviceId);

      res.status(200).json({
        success: true,
        data: vote,
      });
    } catch (error) {
      console.error('[VotesController.getUserVoteForWord] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: '投票情報の取得に失敗しました'
      });
    }
  }

  /**
   * 投票統計を取得
   */
  static getVoteStatsValidation = [
    param('wordId').isInt({ min: 1 }).withMessage('有効な語IDを指定してください'),
  ];

  static async getVoteStats(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('入力データが無効です', 400, errors.array());
      }

      const wordId = parseInt(req.params.wordId);
      const stats = await voteService.getVoteStats(wordId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票可能かチェック
   */
  static canVoteValidation = [
    param('wordId').isInt({ min: 1 }).withMessage('有効な語IDを指定してください'),
  ];

  static async canVote(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array()
        });
      }

      const wordId = parseInt(req.params.wordId);
      const deviceId = req.headers['x-device-id'] as string;
      const userId = (req as any).user?.id || null;

      // 語が存在するかチェック
      const word = await prisma.word.findUnique({
        where: { id: wordId },
      });

      if (!word) {
        return res.status(404).json({
          success: false,
          message: '指定された語が見つかりません'
        });
      }

      if (word.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'この語はまだ投票を受け付けていません'
        });
      }

      // すでに投票済みかチェック
      const existingVote = deviceId ? await voteService.getUserVoteForWord(wordId, deviceId) : null;

      res.status(200).json({
        success: true,
        data: {
          canVote: !existingVote,
          hasVoted: !!existingVote,
          existingVote: existingVote || null,
        },
      });
    } catch (error) {
      console.error('[VotesController.canVote] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: '投票可否の確認に失敗しました'
      });
    }
  }
}