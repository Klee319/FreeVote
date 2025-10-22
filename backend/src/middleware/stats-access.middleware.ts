import { Request, Response, NextFunction } from 'express';
import { StatsAccessService } from '../services/stats-access.service';
import { ForbiddenError, ValidationError } from '../utils/errors';

const statsAccessService = new StatsAccessService();

/**
 * 詳細統計へのアクセス権限をチェックするミドルウェア
 */
export const checkStatsAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pollId = req.params.id;
    const userToken = req.headers['x-user-token'] as string;
    const userId = req.user?.userId;

    if (!userToken) {
      throw new ValidationError('ユーザートークンが必要です');
    }

    // アクセス権限チェック
    const hasAccess = await statsAccessService.canAccessDetailStats(
      pollId,
      userToken,
      userId
    );

    if (!hasAccess) {
      throw new ForbiddenError('詳細統計へのアクセス権限がありません');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 管理者権限をチェックするミドルウェア（既存のミドルウェアがあればそれを使用）
 * ここでは簡易実装として定義
 */
export const checkAdminAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenError('認証が必要です');
    }

    // 実際の実装では、ユーザーの管理者権限をチェック
    // ここでは簡易実装として、認証されていればOKとする
    // 本番では prisma.user.findUnique で isAdmin をチェックする

    next();
  } catch (error) {
    next(error);
  }
};
