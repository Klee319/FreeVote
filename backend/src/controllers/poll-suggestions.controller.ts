import { Request, Response } from 'express';
import { PollSuggestionsService } from '../services/poll-suggestions.service';
import {
  pollSuggestionCreateSchema,
  pollSuggestionUpdateSchema,
  pollSuggestionQuerySchema,
  formatZodError
} from '../utils/validation';
import { AppError } from '../utils/errors';

export class PollSuggestionsController {
  private service: PollSuggestionsService;

  constructor() {
    this.service = new PollSuggestionsService();
  }

  /**
   * 投票提案を作成（認証ユーザー）
   */
  async createSuggestion(req: Request, res: Response) {
    try {
      // リクエストボディのバリデーション
      const validationResult = pollSuggestionCreateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: formatZodError(validationResult.error)
        });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です'
        });
      }

      const { title, description, options, categories } = validationResult.data;
      const suggestion = await this.service.createSuggestion({
        title,
        description,
        options: options as any,
        categories,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: suggestion
      });
    } catch (error) {
      console.error('Create suggestion error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '投票提案の作成に失敗しました'
      });
    }
  }

  /**
   * 投票提案の一覧を取得（管理者のみ）
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      // クエリパラメータのバリデーション
      const validationResult = pollSuggestionQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: formatZodError(validationResult.error)
        });
      }

      const { page = 1, limit = 20, status, search } = validationResult.data;
      const result = await this.service.getSuggestions({
        page,
        limit,
        status,
        search
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '投票提案の取得に失敗しました'
      });
    }
  }

  /**
   * ユーザー自身の投票提案一覧を取得
   */
  async getUserSuggestions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です'
        });
      }

      // クエリパラメータのバリデーション
      const validationResult = pollSuggestionQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: formatZodError(validationResult.error)
        });
      }

      const { page = 1, limit = 20, status } = validationResult.data;
      const result = await this.service.getUserSuggestions({
        userId,
        page,
        limit,
        status
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get user suggestions error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '投票提案の取得に失敗しました'
      });
    }
  }

  /**
   * 投票提案の詳細を取得（管理者のみ）
   */
  async getSuggestionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const suggestion = await this.service.getSuggestionById(id);

      if (!suggestion) {
        return res.status(404).json({
          success: false,
          message: '投票提案が見つかりません'
        });
      }

      res.json({
        success: true,
        data: suggestion
      });
    } catch (error) {
      console.error('Get suggestion by id error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '投票提案の取得に失敗しました'
      });
    }
  }

  /**
   * 投票提案のステータスを更新（管理者のみ）
   */
  async updateSuggestionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // リクエストボディのバリデーション
      const validationResult = pollSuggestionUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: formatZodError(validationResult.error)
        });
      }

      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: '認証が必要です'
        });
      }

      const { status, rejectionReason, adminComment } = validationResult.data;
      const updated = await this.service.updateSuggestionStatus({
        id,
        status,
        rejectionReason,
        adminComment,
        reviewedBy: adminId
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Update suggestion status error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'ステータスの更新に失敗しました'
      });
    }
  }

  /**
   * 投票提案を削除（管理者のみ）
   */
  async deleteSuggestion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.service.deleteSuggestion(id);

      res.json({
        success: true,
        message: '投票提案を削除しました'
      });
    } catch (error) {
      console.error('Delete suggestion error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '投票提案の削除に失敗しました'
      });
    }
  }
}