import { Request, Response, NextFunction } from 'express';
import { ShareService } from '../services/shares.service';
import { shareTrackSchema, shareRankingQuerySchema } from '../utils/validation';
import { AppError } from '../utils/errors';

const shareService = new ShareService();

export class ShareController {
  /**
   * シェア活動を記録
   */
  async trackShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // バリデーション
      const validatedData = shareTrackSchema.parse(req.body);
      const { pollId } = req.params;

      // 認証チェック
      if (!req.user) {
        throw new AppError('認証が必要です', 401);
      }

      const result = await shareService.trackShare({
        pollId,
        userId: req.user.userId,
        platform: validatedData.platform
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * シェアランキングを取得
   */
  async getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // クエリパラメータのバリデーション
      const validatedQuery = shareRankingQuerySchema.parse(req.query);

      const ranking = await shareService.getRanking({
        period: validatedQuery.period || 'week',
        limit: validatedQuery.limit,
        offset: validatedQuery.offset
      });

      res.status(200).json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 自分のシェア統計を取得
   */
  async getMyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 認証チェック
      if (!req.user) {
        throw new AppError('認証が必要です', 401);
      }

      const stats = await shareService.getUserStats(req.user.userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 特定ユーザーのシェア統計を取得（公開情報のみ）
   */
  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await shareService.getPublicUserStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}