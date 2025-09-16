import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';

export class PollSuggestionsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 投票提案を作成
   */
  async createSuggestion(data: {
    title: string;
    description?: string;
    options: Array<{ label: string; description?: string }>;
    categories: string[];
    createdBy: string;
  }): Promise<any> {
    try {
      const result = await this.prisma.pollSuggestion.create({
        data: {
          title: data.title,
          description: data.description,
          options: JSON.stringify(data.options), // JSON文字列に変換
          categories: JSON.stringify(data.categories), // JSON文字列に変換
          createdBy: data.createdBy,
          status: 'pending'
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // JSONフィールドをパースして返す
      return {
        ...result,
        options: JSON.parse(result.options),
        categories: JSON.parse(result.categories)
      };
    } catch (error) {
      console.error('Error creating poll suggestion:', error);
      throw new AppError('投票提案の作成に失敗しました', 500);
    }
  }

  /**
   * 投票提案の一覧を取得（管理者用）
   */
  async getSuggestions(params: {
    page: number;
    limit: number;
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.PollSuggestionWhereInput = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const [suggestions, total] = await Promise.all([
        this.prisma.pollSuggestion.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }),
        this.prisma.pollSuggestion.count({ where })
      ]);

      // JSONフィールドをパース
      const parsedSuggestions = suggestions.map(s => ({
        ...s,
        options: JSON.parse(s.options),
        categories: JSON.parse(s.categories)
      }));

      return {
        suggestions: parsedSuggestions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching poll suggestions:', error);
      throw new AppError('投票提案の取得に失敗しました', 500);
    }
  }

  /**
   * 投票提案の詳細を取得
   */
  async getSuggestionById(id: string): Promise<any> {
    try {
      const result = await this.prisma.pollSuggestion.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!result) return null;

      // JSONフィールドをパース
      return {
        ...result,
        options: JSON.parse(result.options),
        categories: JSON.parse(result.categories)
      };
    } catch (error) {
      console.error('Error fetching poll suggestion:', error);
      throw new AppError('投票提案の取得に失敗しました', 500);
    }
  }

  /**
   * ユーザー自身の投票提案一覧を取得
   */
  async getUserSuggestions(params: {
    userId: string;
    page: number;
    limit: number;
    status?: 'pending' | 'approved' | 'rejected' | 'all';
  }) {
    const { userId, page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.PollSuggestionWhereInput = {
        createdBy: userId
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      const [suggestions, total] = await Promise.all([
        this.prisma.pollSuggestion.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.pollSuggestion.count({ where })
      ]);

      // JSONフィールドをパース
      const parsedSuggestions = suggestions.map(s => ({
        ...s,
        options: JSON.parse(s.options),
        categories: JSON.parse(s.categories)
      }));

      return {
        suggestions: parsedSuggestions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      throw new AppError('投票提案の取得に失敗しました', 500);
    }
  }

  /**
   * 投票提案のステータスを更新（管理者用）
   */
  async updateSuggestionStatus(params: {
    id: string;
    status: 'approved' | 'rejected';
    rejectionReason?: string;
    adminComment?: string;
    reviewedBy: string;
  }): Promise<any> {
    const { id, status, rejectionReason, adminComment, reviewedBy } = params;

    try {
      // 提案が存在し、pendingステータスであることを確認
      const suggestion = await this.prisma.pollSuggestion.findUnique({
        where: { id }
      });

      if (!suggestion) {
        throw new AppError('投票提案が見つかりません', 404);
      }

      if (suggestion.status !== 'pending') {
        throw new AppError('既に処理済みの提案です', 400);
      }

      // ステータス更新
      const updated = await this.prisma.pollSuggestion.update({
        where: { id },
        data: {
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : null,
          adminComment,
          reviewedBy,
          reviewedAt: new Date()
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // 承認された場合、実際の投票を作成することもできるが、
      // ここでは管理者が手動で投票を作成する想定
      if (status === 'approved') {
        // 必要に応じて、自動的に投票を作成する処理を追加
        // await this.createPollFromSuggestion(updated);
      }

      // JSONフィールドをパースして返す
      return {
        ...updated,
        options: JSON.parse(updated.options),
        categories: JSON.parse(updated.categories)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating poll suggestion status:', error);
      throw new AppError('投票提案のステータス更新に失敗しました', 500);
    }
  }

  /**
   * 投票提案を削除（管理者用）
   */
  async deleteSuggestion(id: string): Promise<void> {
    try {
      await this.prisma.pollSuggestion.delete({
        where: { id }
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new AppError('投票提案が見つかりません', 404);
      }
      console.error('Error deleting poll suggestion:', error);
      throw new AppError('投票提案の削除に失敗しました', 500);
    }
  }
}