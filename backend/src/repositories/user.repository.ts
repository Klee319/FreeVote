import { PrismaClient, User, Prisma } from '../generated/prisma';
import { AppError } from '../utils/errors';

export interface CreateUserData {
  email: string;
  displayName?: string;
  prefectureCode?: string;
  ageGroup?: string;
  role?: string;
}

export interface UpdateUserData {
  displayName?: string;
  prefectureCode?: string;
  ageGroup?: string;
  role?: string;
}

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * ユーザーを作成
   */
  async createUser(data: CreateUserData): Promise<User> {
    // メールアドレスの重複チェック
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('このメールアドレスは既に登録されています', 409);
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        prefectureCode: data.prefectureCode,
        ageGroup: data.ageGroup,
        role: data.role || 'user',
      },
      include: {
        prefecture: true,
      },
    });

    return user;
  }

  /**
   * IDでユーザーを取得
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        prefecture: true,
      },
    });

    return user;
  }

  /**
   * メールアドレスでユーザーを取得
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        prefecture: true,
      },
    });

    return user;
  }

  /**
   * ユーザー情報を更新
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        prefecture: true,
      },
    });

    return user;
  }

  /**
   * ユーザーを削除
   */
  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * ユーザー一覧を取得（管理者用）
   */
  async getUsers(params: {
    role?: string;
    prefectureCode?: string;
    limit?: number;
    offset?: number;
  }) {
    const { role, prefectureCode, limit = 20, offset = 0 } = params;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(prefectureCode && { prefectureCode }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          prefecture: true,
          _count: {
            select: {
              votes: true,
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * ユーザーの統計情報を取得
   */
  async getUserStats(userId: string) {
    const [
      voteCount,
      submissionCount,
      approvedSubmissionCount,
      recentVotes,
      votesByAccentType,
    ] = await Promise.all([
      // 総投票数
      this.prisma.vote.count({
        where: { userId },
      }),
      // 総投稿数
      this.prisma.submission.count({
        where: { submittedBy: userId },
      }),
      // 承認された投稿数
      this.prisma.word.count({
        where: {
          submittedBy: userId,
          status: 'approved',
        },
      }),
      // 最近の投票
      this.prisma.vote.findMany({
        where: { userId },
        include: {
          word: true,
          accentType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // アクセント型別の投票数
      this.prisma.vote.groupBy({
        by: ['accentTypeId'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    // アクセント型の詳細情報を取得
    const accentTypes = await this.prisma.accentType.findMany({
      where: {
        id: { in: votesByAccentType.map((v) => v.accentTypeId) },
      },
    });

    const accentTypeStats = votesByAccentType.map((vote) => {
      const type = accentTypes.find((t) => t.id === vote.accentTypeId);
      return {
        accentType: type,
        count: vote._count.id,
      };
    });

    return {
      voteCount,
      submissionCount,
      approvedSubmissionCount,
      recentVotes,
      accentTypeStats,
    };
  }

  /**
   * ユーザーのロールを更新（管理者用）
   */
  async updateUserRole(id: string, role: string): Promise<User> {
    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      throw new AppError('無効なロールです', 400);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      include: {
        prefecture: true,
      },
    });

    return user;
  }
}