import { Request, Response, NextFunction } from 'express';
import userService from '../services/users.service';
import {
  updateProfileSchema,
  updateStatusSchema,
  linkSnsSchema,
  voteHistoryQuerySchema,
  fileUploadSchema,
  formatZodError
} from '../utils/validation';
import { AppError } from '../utils/errors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('無効なファイル形式です。JPEG、PNG、またはWebP形式の画像をアップロードしてください。'));
    }
  }
});

export const uploadMiddleware = upload.single('avatar');

class UsersController {
  /**
   * 自分のプロフィール取得（拡張版）
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const profile = await userService.getUserProfile(userId);

      if (!profile) {
        throw new AppError('プロフィールが見つかりません', 404);
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * プロフィール更新
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const validation = updateProfileSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(formatZodError(validation.error), 400);
      }

      const updatedProfile = await userService.updateProfile(userId, validation.data);

      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ステータス更新（年1回制限）
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const validation = updateStatusSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(formatZodError(validation.error), 400);
      }

      const updatedUser = await userService.updateStatus(userId, validation.data);

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * アバター画像アップロード
   */
  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      if (!req.file) {
        throw new AppError('ファイルがアップロードされていません', 400);
      }

      // ファイルバリデーション
      const validation = fileUploadSchema.safeParse({
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      if (!validation.success) {
        throw new AppError(formatZodError(validation.error), 400);
      }

      // 相対パスを作成（公開URLとして使用）
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await userService.updateProfileImage(userId, avatarUrl);

      res.json({
        success: true,
        data: {
          avatarUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票履歴取得
   */
  async getVoteHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const validation = voteHistoryQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(formatZodError(validation.error), 400);
      }

      const history = await userService.getVotingHistory({
        userId,
        page: validation.data.page,
        limit: validation.data.limit,
        category: validation.data.category
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー統計取得
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const stats = await userService.getUserStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SNS連携
   */
  async linkSns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const validation = linkSnsSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(formatZodError(validation.error), 400);
      }

      const updatedUser = await userService.linkSns(
        userId,
        validation.data.platform,
        validation.data.providerId,
        validation.data.handle
      );

      res.json({
        success: true,
        data: updatedUser,
        message: 'SNS連携が完了しました'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SNS連携解除
   */
  async unlinkSns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const { platform } = req.params;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      if (!['twitter', 'instagram', 'tiktok'].includes(platform)) {
        throw new AppError('無効なプラットフォームです', 400);
      }

      const updatedUser = await userService.unlinkSns(userId, platform);

      res.json({
        success: true,
        data: updatedUser,
        message: 'SNS連携を解除しました'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ステータス変更可能かチェック
   */
  async checkStatusChangeEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new AppError('認証が必要です', 401);
      }

      const eligibility = await userService.canChangeStatus(userId);

      res.json({
        success: true,
        data: eligibility
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();