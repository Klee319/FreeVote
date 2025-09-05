/**
 * 管理機能コントローラー
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { getPrismaClient } from '../config/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

const adminService = new AdminService(getPrismaClient());

class AdminControllerClass {
  /**
   * データベースリセット
   * POST /api/admin/database/reset
   */
  async resetDatabase(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 管理者権限の再確認
      if (req.user?.role !== 'admin') {
        throw new AppError('管理者権限が必要です', 403);
      }

      // リクエストボディから確認コードを取得
      const { confirmationCode } = req.body;

      // 確認コードのチェック（安全のため）
      const expectedCode = `RESET_${new Date().toISOString().split('T')[0]}`;
      if (confirmationCode !== expectedCode) {
        throw new AppError(
          `確認コードが正しくありません。正しいコード: ${expectedCode}`,
          400
        );
      }

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user.id,
        'DATABASE_RESET',
        'database',
        undefined,
        undefined,
        { confirmationCode },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      // データベースリセット実行
      logger.warn(`データベースリセットを実行: ユーザー ${req.user.email} (${req.user.id})`);
      
      const result = await adminService.resetDatabase();

      // 成功レスポンス
      res.status(200).json({
        success: true,
        message: 'データベースがリセットされました',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * データベース統計情報取得
   * GET /api/admin/database/stats
   */
  async getDatabaseStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await adminService.getDatabaseStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 監査ログ取得
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { 
        limit = '50',
        offset = '0',
        userId,
        action,
        resourceType,
        startDate,
        endDate
      } = req.query;

      const prisma = getPrismaClient();
      
      // フィルター条件の構築
      const where: any = {};
      
      if (userId) {
        where.userId = userId as string;
      }
      
      if (action) {
        where.action = action as string;
      }
      
      if (resourceType) {
        where.resourceType = resourceType as string;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      // 監査ログを取得
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー一覧取得
   * GET /api/admin/users
   */
  async getUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { 
        limit = '50',
        offset = '0',
        role,
        search
      } = req.query;

      const prisma = getPrismaClient();
      
      // フィルター条件の構築
      const where: any = {};
      
      if (role) {
        where.role = role as string;
      }
      
      if (search) {
        where.OR = [
          { email: { contains: search as string } },
          { displayName: { contains: search as string } },
        ];
      }

      // ユーザー一覧を取得
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            prefectureCode: true,
            ageGroup: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                votes: true,
                submittedWords: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザーロール更新
   * PUT /api/admin/users/:id/role
   */
  async updateUserRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // 有効なロールかチェック
      const validRoles = ['user', 'moderator', 'admin'];
      if (!validRoles.includes(role)) {
        throw new AppError('無効なロールです', 400);
      }

      // 自分自身のロールは変更不可
      if (id === req.user?.id) {
        throw new AppError('自分自身のロールは変更できません', 400);
      }

      const prisma = getPrismaClient();

      // ユーザーの存在確認
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('ユーザーが見つかりません', 404);
      }

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user!.id,
        'UPDATE_USER_ROLE',
        'user',
        undefined,
        { role: user.role },
        { role },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      // ロール更新
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
        },
      });

      logger.info(`ユーザーロール更新: ${user.email} (${user.role} -> ${role}) by ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'ユーザーロールを更新しました',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

// クラスをエクスポート
export { AdminControllerClass };

// シングルトンインスタンスをエクスポート
export const AdminController = new AdminControllerClass();