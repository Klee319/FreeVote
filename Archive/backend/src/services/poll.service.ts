import { PrismaClient } from '../generated/prisma';
import { AppError } from '../utils/errors';

export interface CreatePollData {
  title: string;
  description?: string;
  isAccentMode?: boolean;
  options: string[]; // 最大4件の選択肢
  wordId?: number;
  deadline?: Date;
  shareHashtags?: string;
  thumbnailUrl?: string;
  optionThumbnails?: string[];
  createdBy: string;
}

export interface SubmitPollVoteData {
  pollId: number;
  optionIndex: number;
  userId?: string;
  deviceId: string;
  prefecture: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PollService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 新規投票を作成
   */
  async createPoll(data: CreatePollData) {
    // 選択肢が2〜4件の範囲内かチェック
    if (data.options.length < 2 || data.options.length > 4) {
      throw new AppError('選択肢は2〜4件で設定してください', 400);
    }

    // アクセントモードの場合、wordIdが必須
    if (data.isAccentMode && !data.wordId) {
      throw new AppError('アクセントモードの場合、wordIdが必要です', 400);
    }

    // deadlineが現在時刻より未来であることを確認
    if (data.deadline && data.deadline <= new Date()) {
      throw new AppError('締切日時は現在時刻より未来の日時を設定してください', 400);
    }

    try {
      const poll = await this.prisma.poll.create({
        data: {
          title: data.title,
          description: data.description,
          isAccentMode: data.isAccentMode || false,
          options: JSON.stringify(data.options),
          wordId: data.wordId,
          deadline: data.deadline,
          shareHashtags: data.shareHashtags,
          thumbnailUrl: data.thumbnailUrl,
          optionThumbnails: data.optionThumbnails ? JSON.stringify(data.optionThumbnails) : null,
          createdBy: data.createdBy,
          status: 'active',
        },
      });

      return {
        ...poll,
        options: JSON.parse(poll.options),
        optionThumbnails: poll.optionThumbnails ? JSON.parse(poll.optionThumbnails) : null,
      };
    } catch (error) {
      throw new AppError(
        `投票の作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        500
      );
    }
  }

  /**
   * 投票一覧を取得（公開中のもののみ）
   */
  async getActivePolls(limit: number = 20, offset: number = 0) {
    const now = new Date();

    const polls = await this.prisma.poll.findMany({
      where: {
        status: 'active',
        OR: [
          { deadline: null },
          { deadline: { gte: now } },
        ],
      },
      include: {
        word: true,
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return polls.map(poll => ({
      ...poll,
      options: JSON.parse(poll.options),
      optionThumbnails: poll.optionThumbnails ? JSON.parse(poll.optionThumbnails) : null,
      voteCount: poll._count.votes,
    }));
  }

  /**
   * 新着投票を取得
   */
  async getRecentPolls(limit: number = 10) {
    const polls = await this.prisma.poll.findMany({
      where: {
        status: 'active',
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { votes: true },
        },
        word: true,
      },
      take: limit,
    });

    return polls.map(poll => ({
      ...poll,
      options: JSON.parse(poll.options),
      optionThumbnails: poll.optionThumbnails ? JSON.parse(poll.optionThumbnails) : null,
      voteCount: poll._count.votes,
    }));
  }

  /**
   * 投票詳細を取得
   */
  async getPollDetail(pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        word: true,
        votes: {
          select: {
            optionIndex: true,
            prefecture: true,
          },
        },
      },
    });

    if (!poll) {
      throw new AppError('指定された投票が見つかりません', 404);
    }

    // 選択肢ごとの集計
    const options = JSON.parse(poll.options);
    const optionStats = options.map((_: string, index: number) => {
      const votes = poll.votes.filter(v => v.optionIndex === index);
      return {
        index,
        count: votes.length,
        percentage: poll.votes.length > 0 ? (votes.length / poll.votes.length) * 100 : 0,
      };
    });

    // 都道府県別の集計
    const prefectureStats = new Map<string, { [key: number]: number }>();
    poll.votes.forEach(vote => {
      if (!prefectureStats.has(vote.prefecture)) {
        prefectureStats.set(vote.prefecture, {});
      }
      const stats = prefectureStats.get(vote.prefecture)!;
      stats[vote.optionIndex] = (stats[vote.optionIndex] || 0) + 1;
    });

    return {
      ...poll,
      options,
      optionThumbnails: poll.optionThumbnails ? JSON.parse(poll.optionThumbnails) : null,
      totalVotes: poll.votes.length,
      optionStats,
      prefectureStats: Array.from(prefectureStats.entries()).map(([pref, stats]) => ({
        prefecture: pref,
        votes: stats,
        dominant: Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || 0,
      })),
    };
  }

  /**
   * 投票を実行
   */
  async submitPollVote(data: SubmitPollVoteData) {
    // 投票の存在確認と状態チェック
    const poll = await this.prisma.poll.findUnique({
      where: { id: data.pollId },
    });

    if (!poll) {
      throw new AppError('指定された投票が見つかりません', 404);
    }

    if (poll.status !== 'active') {
      throw new AppError('この投票は終了しています', 400);
    }

    if (poll.deadline && poll.deadline < new Date()) {
      throw new AppError('投票期限が過ぎています', 400);
    }

    const options = JSON.parse(poll.options);
    if (data.optionIndex < 0 || data.optionIndex >= options.length) {
      throw new AppError('無効な選択肢です', 400);
    }

    // 重複投票チェック
    const existingVote = await this.prisma.pollVote.findUnique({
      where: {
        pollId_deviceId: {
          pollId: data.pollId,
          deviceId: data.deviceId,
        },
      },
    });

    if (existingVote) {
      throw new AppError('既にこの投票に参加済みです', 400);
    }

    // 投票を記録
    const vote = await this.prisma.pollVote.create({
      data: {
        pollId: data.pollId,
        optionIndex: data.optionIndex,
        userId: data.userId,
        deviceId: data.deviceId,
        prefecture: data.prefecture,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    // 最新の集計結果を取得
    const stats = await this.getPollStats(data.pollId);

    return {
      vote,
      stats,
    };
  }

  /**
   * 投票統計を取得
   */
  async getPollStats(pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          select: {
            optionIndex: true,
            prefecture: true,
          },
        },
      },
    });

    if (!poll) {
      throw new AppError('投票が見つかりません', 404);
    }

    const options = JSON.parse(poll.options);
    const totalVotes = poll.votes.length;

    // 選択肢ごとの集計
    const optionStats = options.map((_: string, index: number) => {
      const count = poll.votes.filter(v => v.optionIndex === index).length;
      return {
        index,
        option: options[index],
        count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      };
    });

    return {
      pollId,
      title: poll.title,
      totalVotes,
      options,
      optionStats,
    };
  }

  /**
   * 都道府県別トップ票を取得
   */
  async getPollTopByPrefecture(pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          select: {
            optionIndex: true,
            prefecture: true,
          },
        },
      },
    });

    if (!poll) {
      throw new AppError('投票が見つかりません', 404);
    }

    const options = JSON.parse(poll.options);
    const prefectureMap = new Map<string, number[]>();

    // 都道府県ごとに投票を集計
    poll.votes.forEach(vote => {
      if (!prefectureMap.has(vote.prefecture)) {
        prefectureMap.set(vote.prefecture, new Array(options.length).fill(0));
      }
      const counts = prefectureMap.get(vote.prefecture)!;
      counts[vote.optionIndex]++;
    });

    // 各都道府県の最多得票選択肢を決定
    const result = Array.from(prefectureMap.entries()).map(([prefecture, counts]) => {
      let maxIndex = 0;
      let maxCount = counts[0];
      for (let i = 1; i < counts.length; i++) {
        if (counts[i] > maxCount) {
          maxCount = counts[i];
          maxIndex = i;
        }
      }

      return {
        prefecture,
        topOption: options[maxIndex],
        topOptionIndex: maxIndex,
        topCount: maxCount,
        totalVotes: counts.reduce((sum, count) => sum + count, 0),
      };
    });

    return result;
  }

  /**
   * ユーザーの投票リクエストを作成
   */
  async createVoteRequest(data: {
    title: string;
    description?: string;
    options?: string[];
    deviceId?: string;
    userId?: string;
  }) {
    // 同じタイトルのリクエストがあるかチェック
    const existing = await this.prisma.userVoteRequest.findFirst({
      where: {
        title: data.title,
        status: 'pending',
      },
    });

    if (existing) {
      // カウントをインクリメント
      return await this.prisma.userVoteRequest.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
    }

    // 新規作成
    return await this.prisma.userVoteRequest.create({
      data: {
        title: data.title,
        description: data.description,
        options: data.options ? JSON.stringify(data.options) : null,
        deviceId: data.deviceId,
        userId: data.userId,
      },
    });
  }

  /**
   * 投票リクエスト一覧を取得
   */
  async getVoteRequests(status?: string, limit: number = 20, offset: number = 0) {
    const where = status ? { status } : {};

    const requests = await this.prisma.userVoteRequest.findMany({
      where,
      orderBy: [
        { count: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return requests.map(req => ({
      ...req,
      options: req.options ? JSON.parse(req.options) : null,
    }));
  }

  /**
   * 投票を更新
   */
  async updatePoll(pollId: number, data: {
    title?: string;
    description?: string;
    options?: string[];
    optionThumbnails?: (string | null)[];
    isAccentMode?: boolean;
    deadline?: Date;
    shareHashtags?: string;
    thumbnailUrl?: string;
  }) {
    // 存在確認
    const existingPoll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!existingPoll) {
      throw new AppError('投票が見つかりません', 404);
    }

    // 更新
    const poll = await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        title: data.title,
        description: data.description,
        options: data.options ? JSON.stringify(data.options) : undefined,
        option_thumbnails: data.optionThumbnails ? JSON.stringify(data.optionThumbnails) : undefined,
        is_accent_mode: data.isAccentMode,
        deadline: data.deadline,
        share_hashtags: data.shareHashtags,
        thumbnail_url: data.thumbnailUrl,
        updated_at: new Date(),
      },
    });

    return poll;
  }

  /**
   * 投票を削除
   */
  async deletePoll(pollId: number) {
    // 存在確認
    const existingPoll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!existingPoll) {
      throw new AppError('投票が見つかりません', 404);
    }

    // 関連データも含めて削除（トランザクション）
    await this.prisma.$transaction([
      // 投票データを削除
      this.prisma.poll_vote.deleteMany({
        where: { poll_id: pollId },
      }),
      // 投票本体を削除
      this.prisma.poll.delete({
        where: { id: pollId },
      }),
    ]);

    return true;
  }
}