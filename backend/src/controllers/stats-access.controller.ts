import { Request, Response, NextFunction } from 'express';
import { StatsAccessService } from '../services/stats-access.service';
import { asyncHandler } from '../middleware/error-handler';
import { ValidationError } from '../utils/errors';

const statsAccessService = new StatsAccessService();

/**
 * 詳細統計アクセス権限コントローラー
 */
export class StatsAccessController {
  /**
   * シェア時の詳細統計アクセス権限を付与
   * POST /api/polls/:id/grant-stats-access
   */
  grantAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { userToken } = req.body;

    // リクエストからユーザーIDを取得（認証済みユーザーの場合）
    const grantedBy = req.user?.userId || userToken;

    if (!userToken) {
      throw new ValidationError('ユーザートークンが必要です');
    }

    // 固定で7日間のアクセス権限を付与
    const access = await statsAccessService.grantAccess(
      id,
      userToken,
      grantedBy
    );

    res.json({
      success: true,
      data: {
        accessGranted: true,
        expiresAt: access.expiresAt,
        grantedAt: access.grantedAt,
      },
    });
  });

  /**
   * アクセス権限の確認
   * GET /api/polls/:id/check-stats-access
   */
  checkAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userToken = req.headers['x-user-token'] as string;
    const userId = req.user?.userId;

    if (!userToken) {
      throw new ValidationError('ユーザートークンが必要です');
    }

    // 登録ユーザーは常にアクセス可能
    if (userId) {
      res.json({
        success: true,
        data: {
          hasAccess: true,
          isRegisteredUser: true,
        },
      });
      return;
    }

    // ゲストユーザーのアクセス権限確認
    const accessInfo = await statsAccessService.checkAccess(id, userToken);

    res.json({
      success: true,
      data: {
        ...accessInfo,
        isRegisteredUser: false,
      },
    });
  });

  /**
   * アクセス権限リストの取得（管理者用）
   * GET /api/polls/:id/stats-access-list
   */
  getAccessList = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    // 管理者権限チェックは認証ミドルウェアで実施済みと想定

    const accessList = await statsAccessService.getAccessList(id);

    res.json({
      success: true,
      data: accessList,
    });
  });

  /**
   * アクセス権限の取り消し（管理者用）
   * DELETE /api/polls/:id/revoke-stats-access
   */
  revokeAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { userToken } = req.body;

    if (!userToken) {
      throw new ValidationError('ユーザートークンが必要です');
    }

    await statsAccessService.revokeAccess(id, userToken);

    res.json({
      success: true,
      message: 'アクセス権限を取り消しました',
    });
  });

  /**
   * 期限切れアクセス権限のクリーンアップ（管理者用）
   * POST /api/stats-access/cleanup
   */
  cleanupExpired = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const count = await statsAccessService.cleanupExpiredAccess();

    res.json({
      success: true,
      data: {
        deletedCount: count,
      },
    });
  });
}
