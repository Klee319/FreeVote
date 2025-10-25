import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { config } from "../config/env";

const prisma = new PrismaClient();

// 管理者ユーザーキャッシュ（パフォーマンス改善）
let adminUserCache: { user: any; timestamp: number } | null = null;
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュ

export class AdminService {
  /**
   * ダッシュボード統計取得
   */
  async getDashboardStats() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [totalVotes, totalUsers, activePolls, pendingRequests, closingSoonPolls] = await Promise.all([
      prisma.pollVote.count(),
      prisma.user.count(),
      prisma.poll.count({
        where: {
          deadline: {
            gt: now,
          },
        },
      }),
      prisma.userVoteRequest.count({
        where: {
          status: "pending",
        },
      }),
      // 締切が3日以内の投票
      prisma.poll.count({
        where: {
          deadline: {
            gt: now,
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // 過去7日間と14日間の投票数を取得（成長率計算用）
    const [votesLastWeek, votesPreviousWeek, usersLastWeek, usersPreviousWeek] = await Promise.all([
      prisma.pollVote.count({
        where: {
          votedAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.pollVote.count({
        where: {
          votedAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
    ]);

    // 成長率を計算
    const votesGrowth = votesPreviousWeek === 0
      ? 0
      : Number(((votesLastWeek - votesPreviousWeek) / votesPreviousWeek * 100).toFixed(1));
    const usersGrowth = usersPreviousWeek === 0
      ? 0
      : Number(((usersLastWeek - usersPreviousWeek) / usersPreviousWeek * 100).toFixed(1));

    // 過去7日間の投票数推移（日別に集計）
    const votesByDay = await prisma.pollVote.findMany({
      where: {
        votedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        votedAt: true,
      },
    });

    // 日付ごとに集計
    const votesTrendMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      votesTrendMap.set(dateKey, 0);
    }

    votesByDay.forEach((vote) => {
      const date = new Date(vote.votedAt);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      if (votesTrendMap.has(dateKey)) {
        votesTrendMap.set(dateKey, (votesTrendMap.get(dateKey) || 0) + 1);
      }
    });

    const votesTrend = Array.from(votesTrendMap.entries()).map(([date, votes]) => ({
      date,
      votes,
    }));

    // カテゴリー分布を取得
    const polls = await prisma.poll.findMany({
      select: {
        categories: true,
        _count: {
          select: { votes: true },
        },
      },
    });

    const categoryVotesMap = new Map<string, number>();
    polls.forEach((poll) => {
      // categoriesがJSON文字列の場合とarrayの場合の両方に対応
      let categories: string[] = [];
      if (typeof poll.categories === 'string') {
        try {
          categories = JSON.parse(poll.categories);
        } catch (e) {
          // パースできない場合は単一カテゴリとして扱う
          categories = [poll.categories];
        }
      } else if (Array.isArray(poll.categories)) {
        categories = poll.categories;
      }

      if (Array.isArray(categories)) {
        categories.forEach((category) => {
          if (category) {
            categoryVotesMap.set(
              category,
              (categoryVotesMap.get(category) || 0) + poll._count.votes
            );
          }
        });
      }
    });

    const totalCategoryVotes = Array.from(categoryVotesMap.values()).reduce((sum, count) => sum + count, 0);
    const categoryDistribution = Array.from(categoryVotesMap.entries())
      .map(([name, count]) => ({
        name,
        value: totalCategoryVotes === 0 ? 0 : Math.round((count / totalCategoryVotes) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // 上位5カテゴリーのみ

    // 最近の投票を取得
    const recentPolls = await prisma.poll.findMany({
      where: {
        deadline: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        deadline: true,
        _count: {
          select: { votes: true },
        },
      },
    });

    // 最近のリクエストを取得
    const recentRequests = await prisma.userVoteRequest.findMany({
      where: {
        status: "pending",
      },
      orderBy: {
        likeCount: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        likeCount: true,
        createdAt: true,
      },
    });

    return {
      stats: {
        totalVotes,
        totalUsers,
        activePolls,
        pendingRequests,
        votesGrowth,
        usersGrowth,
        closingSoonPolls,
      },
      votesTrend,
      categoryDistribution,
      recentPolls: recentPolls.map((poll) => ({
        id: poll.id,
        title: poll.title,
        votes: poll._count.votes,
        status: "active" as const,
        deadline: poll.deadline.toISOString().split("T")[0],
      })),
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        title: request.title,
        likes: request.likeCount,
        date: request.createdAt.toISOString().split("T")[0],
      })),
    };
  }

  /**
   * 投票一覧取得
   */
  async getPolls(params: {
    status?: string;
    category?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { status, category, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      if (status === "active") {
        where.deadline = { gt: new Date() };
      } else if (status === "closed") {
        where.deadline = { lte: new Date() };
      }
    }

    if (category) {
      where.categories = {
        has: category,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { votes: true },
          },
        },
      }),
      prisma.poll.count({ where }),
    ]);

    return {
      polls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 投票作成
   */
  async createPoll(data: any) {
    const poll = await prisma.poll.create({
      data: {
        title: data.title,
        description: data.description,
        isAccentMode: data.isAccentMode || false,
        wordId: data.wordId || null,
        options: JSON.stringify(data.options),
        deadline: new Date(data.deadline),
        shareMessage: data.shareMessage || "",
        shareHashtags: data.shareHashtags || "",
        thumbnailUrl: data.thumbnailUrl || "",
        optionThumbnails: JSON.stringify(data.optionThumbnails || []),
        categories: JSON.stringify(data.categories || [data.category]),
        createdBy: data.createdBy,
      },
    });

    return poll;
  }

  /**
   * 投票更新
   */
  async updatePoll(id: string, data: any) {
    // 投票が存在するか確認
    const existingPoll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!existingPoll) {
      throw new ApiError(404, "投票が見つかりません");
    }

    // 締切後は編集不可
    if (existingPoll.deadline < new Date()) {
      throw new ApiError(400, "締切後の投票は編集できません");
    }

    const poll = await prisma.poll.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        options: data.options,
        deadline: new Date(data.deadline),
        shareMessage: data.shareMessage,
        shareHashtags: data.shareHashtags,
        categories: data.categories || [data.category],
      },
    });

    return poll;
  }

  /**
   * 投票削除
   */
  async deletePoll(id: string) {
    // 投票が存在するか確認
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!poll) {
      throw new ApiError(404, "投票が見つかりません");
    }

    // 投票がある場合は論理削除
    if (poll._count.votes > 0) {
      await prisma.poll.update({
        where: { id },
        data: {
          status: "closed", // deletedの代わりにstatusで管理
        },
      });
    } else {
      // 投票がない場合は物理削除
      await prisma.poll.delete({
        where: { id },
      });
    }
  }

  /**
   * ユーザー提案一覧取得
   */
  async getRequests(params: {
    status?: string;
    page: number;
    limit: number;
  }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.userVoteRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.userVoteRequest.count({ where }),
    ]);

    // レスポンスデータの形式を整える
    const formattedRequests = requests.map((request) => {
      let categories: string[] = [];
      let options: string[] = [];

      // categoriesがJSON文字列の場合はパース
      if (typeof request.categories === 'string') {
        try {
          categories = JSON.parse(request.categories);
        } catch (e) {
          categories = [request.categories]; // パースできない場合は配列に変換
        }
      } else if (Array.isArray(request.categories)) {
        categories = request.categories;
      }

      // optionsがJSON文字列の場合はパース
      if (typeof request.options === 'string') {
        try {
          options = JSON.parse(request.options);
        } catch (e) {
          options = [request.options]; // パースできない場合は配列に変換
        }
      } else if (Array.isArray(request.options)) {
        options = request.options;
      }

      return {
        ...request,
        categories,
        options,
        username: request.user?.username,
      };
    });

    return {
      requests: formattedRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ユーザー提案承認
   */
  async approveRequest(id: string, adminComment?: string) {
    const request = await prisma.userVoteRequest.findUnique({
      where: { id },
      include: {
        user: true, // ユーザー情報も含めて取得
      },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    // 作成者のユーザーIDを決定
    let creatorUserId: string;

    // 1. リクエストにユーザーIDがある場合は、そのユーザーが存在することを確認
    if (request.userId) {
      // ユーザーの存在確認（includeで既に取得済み）
      if (request.user) {
        creatorUserId = request.userId;
      } else {
        // ユーザーIDはあるが実際のユーザーが存在しない場合（削除されたユーザー等）
        // 管理者ユーザーを使用
        const adminUser = await this.getOrCreateAdminUser();
        creatorUserId = adminUser.id;
      }
    } else {
      // 2. userIdがnullの場合は管理者ユーザーを取得または作成
      const adminUser = await this.getOrCreateAdminUser();
      creatorUserId = adminUser.id;
    }

    try {
      // 提案を元に新しい投票を作成
      const poll = await prisma.poll.create({
        data: {
          title: request.title,
          description: request.description,
          isAccentMode: false,
          options: request.options,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
          categories: request.categories || JSON.stringify(["ユーザー提案"]),
          createdBy: creatorUserId,
        },
      });

      // 提案のステータスを更新
      await prisma.userVoteRequest.update({
        where: { id },
        data: {
          status: "approved",
          adminComment: adminComment,
          reviewedAt: new Date(),
          reviewedBy: creatorUserId, // 実際の管理者IDを使用
        },
      });

      return poll;
    } catch (error) {
      console.error("投票作成エラー:", error);
      throw new ApiError(500, "投票の作成に失敗しました");
    }
  }

  /**
   * 管理者ユーザーを取得または作成
   */
  async getOrCreateAdminUser() {
    // キャッシュチェック（パフォーマンス改善）
    if (adminUserCache && (Date.now() - adminUserCache.timestamp) < ADMIN_CACHE_TTL) {
      return adminUserCache.user;
    }

    // 既存の管理者ユーザーを取得
    let adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      // 管理者ユーザーが存在しない場合は作成
      // セキュリティ: 環境変数からパスワードを取得、デフォルトはランダム生成
      const defaultPassword = config.admin.defaultPassword || crypto.randomBytes(32).toString('hex');
      const adminPassword = await bcrypt.hash(defaultPassword, 10);

      try {
        adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@example.com',
            passwordHash: adminPassword,
            ageGroup: '30代',
            prefecture: '東京都',
            gender: 'その他',
            isAdmin: true,
          },
        });
      } catch (error) {
        // ユーザー名が既に存在する場合の対処
        const existingUser = await prisma.user.findUnique({
          where: { username: 'admin' },
        });

        if (existingUser) {
          // 既存のadminユーザーを管理者に昇格
          adminUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: { isAdmin: true },
          });
        } else {
          throw error;
        }
      }
    }

    // キャッシュを更新
    adminUserCache = {
      user: adminUser,
      timestamp: Date.now()
    };

    return adminUser;
  }


  /**
   * ユーザー提案却下
   */
  async rejectRequest(id: string, reason?: string, adminComment?: string) {
    const request = await prisma.userVoteRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    // 管理者ユーザーを取得または作成
    const adminUser = await this.getOrCreateAdminUser();

    await prisma.userVoteRequest.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: reason,
        adminComment: adminComment,
        reviewedAt: new Date(),
        reviewedBy: adminUser.id, // 実際の管理者IDを使用
      },
    });
  }

  /**
   * 投票データインポート
   */
  async importPolls(polls: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // 管理者ユーザーを取得または作成
    const adminUser = await this.getOrCreateAdminUser();

    for (const pollData of polls) {
      try {
        await this.createPoll({
          ...pollData,
          createdBy: adminUser.id,
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          poll: pollData.title,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * データエクスポート
   */
  async exportData(type: string) {
    const data: any = {
      exported_at: new Date().toISOString(),
    };

    if (type === "polls" || type === "all") {
      data.polls = await prisma.poll.findMany({
        where: {
          status: { not: "closed" },
        },
      });
    }

    if (type === "votes" || type === "all") {
      data.votes = await prisma.pollVote.findMany();
    }

    if (type === "users" || type === "all") {
      data.users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          ageGroup: true,
          prefecture: true,
          gender: true,
          referralCount: true,
          createdAt: true,
        },
      });
    }

    return data;
  }

  /**
   * ユーザー一覧取得
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    page: number;
    limit: number;
  }) {
    const { search, role, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.isAdmin = role === 'admin';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          username: true,
          email: true,
          ageGroup: true,
          prefecture: true,
          gender: true,
          isAdmin: true,
          referralCount: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ユーザー更新
   */
  async updateUser(id: string, data: any) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        ageGroup: data.ageGroup,
        prefecture: data.prefecture,
        gender: data.gender,
        isAdmin: data.isAdmin || false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        isAdmin: true,
        referralCount: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * ユーザー削除
   */
  async deleteUser(id: string) {
    await prisma.user.delete({
      where: { id },
    });
  }
}

export const adminService = new AdminService();