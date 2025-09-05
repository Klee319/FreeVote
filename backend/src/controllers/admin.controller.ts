/**
 * 管理機能コントローラー
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { getPrismaClient } from '../config/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const adminService = new AdminService(getPrismaClient());

// バリデーションスキーマ
const createWordSchema = z.object({
  headword: z.string().min(1).max(100),
  reading: z.string().min(1).max(100),
  category: z.enum(['general', 'technical', 'dialect', 'proper_noun']),
  moraCount: z.number().int().positive(),
  moraSegments: z.array(z.string()),
  accentOptions: z.array(z.object({
    accentTypeId: z.number(),
    pattern: z.array(z.number()),
    dropPosition: z.number().optional(),
  })),
});

const updateWordSchema = z.object({
  headword: z.string().min(1).max(100).optional(),
  reading: z.string().min(1).max(100).optional(),
  category: z.enum(['general', 'technical', 'dialect', 'proper_noun']).optional(),
  moraCount: z.number().int().positive().optional(),
  moraSegments: z.array(z.string()).optional(),
});

const bulkImportSchema = z.object({
  words: z.array(createWordSchema),
});

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

  /**
   * 単語管理: 単語一覧取得
   * GET /api/admin/words
   */
  async getWords(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page = '1', limit = '20', category, sortBy = 'recent' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const prisma = getPrismaClient();

      // フィルター条件
      const where: any = {};
      if (category) {
        where.category = category;
      }

      // ソート条件
      let orderBy: any;
      switch (sortBy) {
        case 'popularity':
          orderBy = { total_votes: 'desc' };
          break;
        case 'alphabetical':
          orderBy = { headword: 'asc' };
          break;
        case 'recent':
        default:
          orderBy = { created_at: 'desc' };
          break;
      }

      const [words, totalCount] = await Promise.all([
        prisma.word.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            accent_options: {
              include: {
                accent_type: true,
              },
            },
            _count: {
              select: {
                accent_votes: true,
              },
            },
          },
        }),
        prisma.word.count({ where }),
      ]);

      res.json({
        words: words.map(word => ({
          id: word.id,
          headword: word.headword,
          reading: word.reading,
          category: word.category,
          moraCount: word.mora_count,
          moraSegments: word.mora_segments,
          totalVotes: word._count.accent_votes,
          accentOptions: word.accent_options.map(option => ({
            id: option.id,
            accentType: {
              code: option.accent_type.code,
              name: option.accent_type.name,
            },
            pattern: option.pattern,
            dropPosition: option.drop_position,
          })),
          createdAt: word.created_at,
          updatedAt: word.updated_at,
        })),
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 単語作成
   * POST /api/admin/words
   */
  async createWord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = createWordSchema.parse(req.body);
      const prisma = getPrismaClient();

      const word = await prisma.$transaction(async (tx) => {
        // 単語を作成
        const newWord = await tx.word.create({
          data: {
            headword: validatedData.headword,
            reading: validatedData.reading,
            category: validatedData.category,
            mora_count: validatedData.moraCount,
            mora_segments: validatedData.moraSegments,
            total_votes: 0,
          },
        });

        // アクセントオプションを作成
        if (validatedData.accentOptions && validatedData.accentOptions.length > 0) {
          await tx.accent_option.createMany({
            data: validatedData.accentOptions.map(option => ({
              word_id: newWord.id,
              accent_type_id: option.accentTypeId,
              pattern: option.pattern,
              drop_position: option.dropPosition,
            })),
          });
        }

        return newWord;
      });

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user!.id,
        'CREATE_WORD',
        'word',
        word.id.toString(),
        undefined,
        { headword: word.headword, reading: word.reading },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      res.status(201).json({
        success: true,
        message: '単語を作成しました',
        wordId: word.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('入力データが不正です', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * 単語更新
   * PUT /api/admin/words/:id
   */
  async updateWord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateWordSchema.parse(req.body);
      const prisma = getPrismaClient();

      const word = await prisma.word.update({
        where: { id: parseInt(id) },
        data: {
          ...(validatedData.headword && { headword: validatedData.headword }),
          ...(validatedData.reading && { reading: validatedData.reading }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.moraCount && { mora_count: validatedData.moraCount }),
          ...(validatedData.moraSegments && { mora_segments: validatedData.moraSegments }),
          updated_at: new Date(),
        },
      });

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user!.id,
        'UPDATE_WORD',
        'word',
        word.id.toString(),
        undefined,
        validatedData,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      res.json({
        success: true,
        message: '単語を更新しました',
        word: {
          id: word.id,
          headword: word.headword,
          reading: word.reading,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('入力データが不正です', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * 単語削除
   * DELETE /api/admin/words/:id
   */
  async deleteWord(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const wordId = parseInt(id);
      const prisma = getPrismaClient();

      await prisma.$transaction(async (tx) => {
        // 関連する投票を削除
        await tx.accent_vote.deleteMany({
          where: { word_id: wordId },
        });

        // アクセントオプションを削除
        await tx.accent_option.deleteMany({
          where: { word_id: wordId },
        });

        // 単語を削除
        await tx.word.delete({
          where: { id: wordId },
        });
      });

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user!.id,
        'DELETE_WORD',
        'word',
        id,
        undefined,
        undefined,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      res.json({
        success: true,
        message: '単語を削除しました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * JSON一括インポート
   * POST /api/admin/words/import
   */
  async importWords(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = bulkImportSchema.parse(req.body);
      const prisma = getPrismaClient();
      
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const wordData of validatedData.words) {
        try {
          await prisma.$transaction(async (tx) => {
            // 重複チェック
            const existing = await tx.word.findFirst({
              where: {
                headword: wordData.headword,
                reading: wordData.reading,
              },
            });

            if (existing) {
              throw new Error(`既に存在します: ${wordData.headword} (${wordData.reading})`);
            }

            // 単語を作成
            const newWord = await tx.word.create({
              data: {
                headword: wordData.headword,
                reading: wordData.reading,
                category: wordData.category,
                mora_count: wordData.moraCount,
                mora_segments: wordData.moraSegments,
                total_votes: 0,
              },
            });

            // アクセントオプションを作成
            if (wordData.accentOptions && wordData.accentOptions.length > 0) {
              await tx.accent_option.createMany({
                data: wordData.accentOptions.map(option => ({
                  word_id: newWord.id,
                  accent_type_id: option.accentTypeId,
                  pattern: option.pattern,
                  drop_position: option.dropPosition,
                })),
              });
            }
          });

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push(`${wordData.headword}: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 監査ログを記録
      await adminService.createAuditLog(
        req.user!.id,
        'BULK_IMPORT_WORDS',
        'word',
        undefined,
        undefined,
        { successCount, failedCount },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        }
      );

      res.json({
        success: true,
        message: `インポート完了: 成功 ${successCount}件, 失敗 ${failedCount}件`,
        details: {
          successCount,
          failedCount,
          errors: errors.slice(0, 10), // エラーメッセージは最初の10件のみ
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('インポートデータの形式が不正です', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * 投票統計取得
   * GET /api/admin/stats/overview
   */
  async getVoteStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();

      const [totalWords, totalVotes, totalUsers, recentVotes] = await Promise.all([
        prisma.word.count(),
        prisma.accent_vote.count(),
        prisma.accent_vote.findMany({
          select: { device_id: true },
          distinct: ['device_id'],
        }),
        prisma.accent_vote.count({
          where: {
            voted_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalWords,
          totalVotes,
          totalUsers: totalUsers.length,
          recentVotes,
          averageVotesPerWord: totalWords > 0 ? Math.round(totalVotes / totalWords) : 0,
        },
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