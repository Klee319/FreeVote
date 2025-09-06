import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { PollService } from '../services/poll.service';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();
const pollService = new PollService(prisma);

export class PollsController {
  /**
   * 新規投票を作成（管理者のみ）
   */
  static createPollValidation = [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('description').optional(),
    body('isAccentMode').optional().isBoolean(),
    body('options')
      .isArray({ min: 2, max: 4 })
      .withMessage('選択肢は2〜4件で設定してください'),
    body('wordId').optional().isInt({ min: 1 }),
    body('deadline').optional().isISO8601(),
    body('shareHashtags').optional(),
    body('thumbnailUrl').optional().isURL(),
    body('optionThumbnails').optional().isArray(),
  ];

  static async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array(),
        });
      }

      // 管理者権限チェック（仮実装：実際の認証システムに合わせて修正）
      const userId = (req as any).user?.id || req.body.createdBy;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です',
        });
      }

      const poll = await pollService.createPoll({
        ...req.body,
        createdBy: userId,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      });

      res.status(201).json({
        success: true,
        data: poll,
        message: '投票を作成しました',
      });
    } catch (error) {
      console.error('[PollsController.createPoll] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票の作成に失敗しました',
      });
    }
  }

  /**
   * 公開中の投票一覧を取得
   */
  static getPollsValidation = [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ];

  static async getPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const polls = await pollService.getActivePolls(limit, offset);

      res.status(200).json({
        success: true,
        data: polls,
        pagination: {
          limit,
          offset,
          count: polls.length,
        },
      });
    } catch (error) {
      console.error('[PollsController.getPolls] Error:', error);
      
      res.status(500).json({
        success: false,
        message: '投票一覧の取得に失敗しました',
      });
    }
  }

  /**
   * 投票詳細を取得
   */
  static getPollDetailValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
  ];

  static async getPollDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const poll = await pollService.getPollDetail(pollId);

      res.status(200).json({
        success: true,
        data: poll,
      });
    } catch (error) {
      console.error('[PollsController.getPollDetail] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票詳細の取得に失敗しました',
      });
    }
  }

  /**
   * 投票を実行
   */
  static submitVoteValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
    body('optionIndex').isInt({ min: 0, max: 3 }).withMessage('有効な選択肢を指定してください'),
    body('prefecture').notEmpty().withMessage('都道府県は必須です'),
  ];

  static async submitVote(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const { optionIndex, prefecture } = req.body;
      
      // デバイスIDをヘッダーまたはボディから取得
      const deviceId = req.body.deviceId || req.headers['x-device-id'] as string;
      const userId = (req as any).user?.id || req.body.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'デバイスIDが必要です',
        });
      }

      const result = await pollService.submitPollVote({
        pollId,
        optionIndex,
        userId,
        deviceId,
        prefecture,
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        success: true,
        data: result.vote,
        stats: result.stats,
        message: '投票が完了しました',
      });
    } catch (error) {
      console.error('[PollsController.submitVote] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票処理に失敗しました',
      });
    }
  }

  /**
   * 投票統計を取得
   */
  static getPollStatsValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
  ];

  static async getPollStats(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const stats = await pollService.getPollStats(pollId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[PollsController.getPollStats] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票統計の取得に失敗しました',
      });
    }
  }

  /**
   * 都道府県別トップ票を取得
   */
  static getPollTopByPrefectureValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
  ];

  static async getPollTopByPrefecture(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const result = await pollService.getPollTopByPrefecture(pollId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[PollsController.getPollTopByPrefecture] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '都道府県別統計の取得に失敗しました',
      });
    }
  }

  /**
   * 投票を更新（管理者のみ）
   */
  static updatePollValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
    body('title').optional().notEmpty().withMessage('タイトルは必須です'),
    body('description').optional(),
    body('isAccentMode').optional().isBoolean(),
    body('options').optional()
      .isArray({ min: 2, max: 4 })
      .withMessage('選択肢は2〜4件で設定してください'),
    body('deadline').optional().isISO8601(),
    body('shareHashtags').optional(),
    body('thumbnailUrl').optional().isURL(),
    body('optionThumbnails').optional().isArray(),
  ];

  static async updatePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です',
        });
      }

      const poll = await pollService.updatePoll(pollId, {
        ...req.body,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      });

      res.status(200).json({
        success: true,
        data: poll,
        message: '投票を更新しました',
      });
    } catch (error) {
      console.error('[PollsController.updatePoll] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票の更新に失敗しました',
      });
    }
  }

  /**
   * 投票を削除（管理者のみ）
   */
  static deletePollValidation = [
    param('id').isInt({ min: 1 }).withMessage('有効な投票IDを指定してください'),
  ];

  static async deletePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const pollId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です',
        });
      }

      await pollService.deletePoll(pollId);

      res.status(200).json({
        success: true,
        message: '投票を削除しました',
      });
    } catch (error) {
      console.error('[PollsController.deletePoll] Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: '投票の削除に失敗しました',
      });
    }
  }

  /**
   * 投票リクエストを作成
   */
  static createVoteRequestValidation = [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('description').optional(),
    body('options').optional().isArray({ max: 4 }),
  ];

  static async createVoteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力データが無効です',
          errors: errors.array(),
        });
      }

      const deviceId = req.body.deviceId || req.headers['x-device-id'] as string;
      const userId = (req as any).user?.id || req.body.userId;

      const request = await pollService.createVoteRequest({
        ...req.body,
        deviceId,
        userId,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: '投票リクエストを送信しました',
      });
    } catch (error) {
      console.error('[PollsController.createVoteRequest] Error:', error);
      
      res.status(500).json({
        success: false,
        message: '投票リクエストの作成に失敗しました',
      });
    }
  }

  /**
   * 投票リクエスト一覧を取得
   */
  static getVoteRequestsValidation = [
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ];

  static async getVoteRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '入力パラメータが無効です',
          errors: errors.array(),
        });
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const requests = await pollService.getVoteRequests(status, limit, offset);

      res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          limit,
          offset,
          count: requests.length,
        },
      });
    } catch (error) {
      console.error('[PollsController.getVoteRequests] Error:', error);
      
      res.status(500).json({
        success: false,
        message: '投票リクエスト一覧の取得に失敗しました',
      });
    }
  }
}