import { PrismaClient } from "@prisma/client";
import { ApiError } from "../utils/errors";

const prisma = new PrismaClient();

export class AdminService {
  /**
   * ダッシュボード統計取得
   */
  async getDashboardStats() {
    const [totalVotes, totalUsers, activePolls, pendingRequests] = await Promise.all([
      prisma.pollVote.count(),
      prisma.user.count(),
      prisma.poll.count({
        where: {
          deadline: {
            gt: new Date(),
          },
        },
      }),
      prisma.userVoteRequest.count({
        where: {
          status: "pending",
        },
      }),
    ]);

    // 過去7日間の投票数推移
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const votesTrend = await prisma.pollVote.groupBy({
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
      }),
      prisma.userVoteRequest.count({ where }),
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
    const request = await prisma.userVoteRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    // 提案を元に新しい投票を作成
    const poll = await prisma.poll.create({
      data: {
        title: request.title,
        description: request.description,
        isAccentMode: false,
        options: request.options,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
        categories: JSON.stringify(["ユーザー提案"]),
        createdBy: "admin",
      },
    });

    // 提案のステータスを更新
    await prisma.userVoteRequest.update({
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
    const request = await prisma.userVoteRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new ApiError(404, "提案が見つかりません");
    }

    await prisma.userVoteRequest.update({
      where: { id },
      data: {
        status: "rejected",
        // rejectionReason: reason, // UserVoteRequestにはこのフィールドがない
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