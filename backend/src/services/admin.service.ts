import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";

const prisma = new PrismaClient();

export class AdminService {
  /**
   * ダッシュボード統計取得
   */
  async getDashboardStats() {
    const [totalVotes, totalUsers, activePolls, pendingRequests] = await Promise.all([
      prisma.pollVotes.count(),
      prisma.users.count(),
      prisma.polls.count({
        where: {
          deadline: {
            gt: new Date(),
          },
        },
      }),
      prisma.userVoteRequests.count({
        where: {
          status: "pending",
        },
      }),
    ]);

    // 過去7日間の投票数推移
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const votesTrend = await prisma.pollVotes.groupBy({
      by: ["votedAt"],
      where: {
        votedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    });

    return {
      totalVotes,
      totalUsers,
      activePolls,
      pendingRequests,
      votesTrend,
      votesGrowth: 12.5, // TODO: 実際の成長率を計算
      usersGrowth: 8.3,  // TODO: 実際の成長率を計算
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
      prisma.polls.findMany({
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
      prisma.polls.count({ where }),
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
    const poll = await prisma.polls.create({
      data: {
        title: data.title,
        description: data.description,
        isAccentMode: data.isAccentMode || false,
        wordId: data.wordId || null,
        options: data.options,
        deadline: new Date(data.deadline),
        shareMessage: data.shareMessage || "",
        shareHashtags: data.shareHashtags || "",
        thumbnailUrl: data.thumbnailUrl || "",
        optionThumbnails: data.optionThumbnails || [],
        categories: data.categories || [data.category],
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
    const existingPoll = await prisma.polls.findUnique({
      where: { id },
    });

    if (!existingPoll) {
      throw new ApiError(404, "投票が見つかりません");
    }

    // 締切後は編集不可
    if (existingPoll.deadline < new Date()) {
      throw new ApiError(400, "締切後の投票は編集できません");
    }

    const poll = await prisma.polls.update({
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
    const poll = await prisma.polls.findUnique({
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
      await prisma.polls.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } else {
      // 投票がない場合は物理削除
      await prisma.polls.delete({
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
      prisma.userVoteRequests.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.userVoteRequests.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ユーザー提案承認
   */
  async approveRequest(id: string) {
    const request = await prisma.userVoteRequests.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    // 提案を元に新しい投票を作成
    const poll = await prisma.polls.create({
      data: {
        title: request.title,
        description: request.description,
        isAccentMode: false,
        options: request.options,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
        categories: ["ユーザー提案"],
        createdBy: "admin",
      },
    });

    // 提案のステータスを更新
    await prisma.userVoteRequests.update({
      where: { id },
      data: {
        status: "approved",
      },
    });

    return poll;
  }

  /**
   * ユーザー提案却下
   */
  async rejectRequest(id: string, reason?: string) {
    const request = await prisma.userVoteRequests.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    await prisma.userVoteRequests.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: reason,
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

    for (const pollData of polls) {
      try {
        await this.createPoll({
          ...pollData,
          createdBy: "admin",
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
      data.polls = await prisma.polls.findMany({
        where: {
          deletedAt: null,
        },
      });
    }

    if (type === "votes" || type === "all") {
      data.votes = await prisma.pollVotes.findMany();
    }

    if (type === "users" || type === "all") {
      data.users = await prisma.users.findMany({
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
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
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
          role: true,
          referralCount: true,
          createdAt: true,
        },
      }),
      prisma.users.count({ where }),
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
    const user = await prisma.users.update({
      where: { id },
      data: {
        username: data.username,
        ageGroup: data.ageGroup,
        prefecture: data.prefecture,
        gender: data.gender,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        role: true,
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
    await prisma.users.delete({
      where: { id },
    });
  }
}

export const adminService = new AdminService();