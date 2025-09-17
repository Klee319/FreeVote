import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { voteSchema } from '../utils/validation';

const prisma = new PrismaClient();

interface PollFilters {
  category?: string;
  search?: string;
  sort?: 'new' | 'trending' | 'voteCount';
  page?: number;
  limit?: number;
  active?: boolean;
}

interface VoteData {
  option: number;
  prefecture: string;
  ageGroup?: string;
  gender?: string;
  userToken?: string;
  userId?: string;
}

export class PollsService {
  // 投票一覧取得
  async getPolls(filters: PollFilters = {}) {
    const {
      category,
      search,
      sort = 'trending',
      page = 1,
      limit = 20,
      active,
    } = filters;

    const skip = (page - 1) * limit;

    // 検索条件構築
    const where: any = {
      status: 'active',
    };

    // activeパラメータに応じて期間フィルタを適用
    if (active !== undefined) {
      if (active) {
        // 期間中の投票のみ（期限なし または 期限が未来）
        where.OR = [
          { deadline: null },
          { deadline: { gt: new Date() } },
        ];
      } else {
        // 期間外の投票のみ（期限が過去）
        where.deadline = { lt: new Date() };
      }
    }
    // activeパラメータがない場合はすべての投票を表示（フィルタなし）

    if (category) {
      where.categories = { has: category };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // ソート条件
    let orderBy: any = {};
    switch (sort) {
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'voteCount':
        orderBy = { votes: { _count: 'desc' } };
        break;
      case 'trending':
      default:
        // トレンディングは別途計算が必要（簡易版として閲覧数を使用）
        orderBy = { viewCount: 'desc' };
        break;
    }

    // データ取得
    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { votes: true },
          },
          creator: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.poll.count({ where }),
    ]);

    // レスポンス整形
    const formattedPolls = polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      isAccentMode: poll.isAccentMode,
      options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options,
      deadline: poll.deadline,
      thumbnailUrl: poll.thumbnailUrl,
      categories: typeof poll.categories === 'string' ? JSON.parse(poll.categories) : poll.categories,
      voteCount: poll._count.votes,
      viewCount: poll.viewCount,
      createdAt: poll.createdAt,
      createdBy: poll.creator.username || 'Unknown',
    }));

    return {
      polls: formattedPolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 投票詳細取得
  async getPollById(id: string) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        votes: {
          select: {
            option: true,
            prefecture: true,
            ageGroup: true,
            gender: true,
          },
        },
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    // 締切チェック
    const isClosed = poll.deadline && poll.deadline < new Date();

    // 閲覧数を増加
    await prisma.poll.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 集計データの計算
    const voteCounts = new Map<number, number>();
    const prefectureCounts = new Map<string, Map<number, number>>();
    const ageGroupCounts = new Map<string, Map<number, number>>();
    const genderCounts = new Map<string, Map<number, number>>();

    poll.votes.forEach((vote) => {
      // 全体集計
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);

      // 都道府県別集計
      if (!prefectureCounts.has(vote.prefecture)) {
        prefectureCounts.set(vote.prefecture, new Map());
      }
      const prefMap = prefectureCounts.get(vote.prefecture)!;
      prefMap.set(vote.option, (prefMap.get(vote.option) || 0) + 1);

      // 年代別集計
      if (vote.ageGroup) {
        if (!ageGroupCounts.has(vote.ageGroup)) {
          ageGroupCounts.set(vote.ageGroup, new Map());
        }
        const ageMap = ageGroupCounts.get(vote.ageGroup)!;
        ageMap.set(vote.option, (ageMap.get(vote.option) || 0) + 1);
      }

      // 性別別集計
      if (vote.gender) {
        if (!genderCounts.has(vote.gender)) {
          genderCounts.set(vote.gender, new Map());
        }
        const genderMap = genderCounts.get(vote.gender)!;
        genderMap.set(vote.option, (genderMap.get(vote.option) || 0) + 1);
      }
    });

    // レスポンス整形
    const totalVotes = poll.votes.length;
    const parsedOptions = typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options;
    const results = Array.from({ length: parsedOptions.length }, (_, i) => ({
      option: i,
      count: voteCounts.get(i) || 0,
      percentage: totalVotes > 0 ? ((voteCounts.get(i) || 0) / totalVotes) * 100 : 0,
    }));

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        isAccentMode: poll.isAccentMode,
        wordId: poll.wordId,
        options: parsedOptions,
        deadline: poll.deadline,
        shareMessage: poll.shareMessage,
        shareHashtags: poll.shareHashtags,
        thumbnailUrl: poll.thumbnailUrl,
        optionThumbnails: poll.optionThumbnails ?
          (typeof poll.optionThumbnails === 'string' ? JSON.parse(poll.optionThumbnails) : poll.optionThumbnails) : null,
        categories: typeof poll.categories === 'string' ? JSON.parse(poll.categories) : poll.categories,
        status: isClosed ? 'closed' : poll.status,
        viewCount: poll.viewCount,
        createdAt: poll.createdAt,
        createdBy: poll.creator.username || 'Unknown',
      },
      results: {
        totalVotes,
        options: results,
        topOption: results.reduce((max, curr) =>
          curr.count > max.count ? curr : max,
          results[0]
        ),
      },
    };
  }

  // 投票する
  async vote(pollId: string, data: VoteData): Promise<any> {
    const validated = voteSchema.parse(data);

    // 投票の存在確認と締切チェック
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    if (poll.status !== 'active') {
      throw new ConflictError('この投票は終了しています');
    }

    if (poll.deadline && poll.deadline < new Date()) {
      throw new ConflictError('この投票は締め切りを過ぎています');
    }

    // 選択肢の範囲チェック
    const options = JSON.parse(poll.options as string) as any[];
    const optionsCount = options.length;
    if (validated.option < 0 || validated.option >= optionsCount) {
      throw new ValidationError('無効な選択肢です');
    }

    // userTokenの生成または使用
    let userToken = data.userToken;
    if (!userToken) {
      userToken = uuidv4();
    }

    // 重複投票チェック
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userToken: {
          pollId,
          userToken,
        },
      },
    });

    if (existingVote) {
      throw new ConflictError('すでに投票済みです');
    }

    // 投票を保存
    const vote = await prisma.pollVote.create({
      data: {
        pollId,
        option: validated.option,
        prefecture: validated.prefecture,
        ageGroup: validated.ageGroup,
        gender: validated.gender,
        userId: data.userId,
        userToken,
      },
    });

    // 投票数を取得
    const voteCount = await prisma.pollVote.count({
      where: { pollId },
    });

    return {
      vote: {
        id: vote.id,
        option: vote.option,
        votedAt: vote.votedAt,
      },
      userToken,
      voteCount,
    };
  }

  // 都道府県ごとのトップ選択肢取得
  async getTopByPrefecture(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    // 都道府県ごとの投票を集計
    const votes = await prisma.pollVote.findMany({
      where: { pollId },
      select: {
        option: true,
        prefecture: true,
      },
    });

    const prefectureResults = new Map<string, Map<number, number>>();

    votes.forEach((vote) => {
      if (!prefectureResults.has(vote.prefecture)) {
        prefectureResults.set(vote.prefecture, new Map());
      }
      const optionCounts = prefectureResults.get(vote.prefecture)!;
      optionCounts.set(vote.option, (optionCounts.get(vote.option) || 0) + 1);
    });

    // 各都道府県のトップ選択肢を決定
    const results: Record<string, { option: number; count: number; percentage: number }> = {};

    prefectureResults.forEach((optionCounts, prefecture) => {
      let topOption = 0;
      let maxCount = 0;
      let total = 0;

      optionCounts.forEach((count, option) => {
        total += count;
        if (count > maxCount) {
          maxCount = count;
          topOption = option;
        }
      });

      results[prefecture] = {
        option: topOption,
        count: maxCount,
        percentage: total > 0 ? (maxCount / total) * 100 : 0,
      };
    });

    return {
      pollId,
      title: poll.title,
      options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options,
      results,
    };
  }

  // 詳細統計取得
  async getStats(pollId: string, filterBy?: 'age' | 'gender' | 'prefecture') {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          select: {
            option: true,
            prefecture: true,
            ageGroup: true,
            gender: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    const parsedOptions = typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options;
    const stats: any = {
      pollId: poll.id,
      title: poll.title,
      options: parsedOptions,
      totalVotes: poll.votes.length,
      breakdown: {},
    };

    if (!filterBy || filterBy === 'age') {
      // 年代別集計
      const ageBreakdown: Record<string, Record<number, number>> = {};
      poll.votes.forEach((vote) => {
        if (vote.ageGroup) {
          if (!ageBreakdown[vote.ageGroup]) {
            ageBreakdown[vote.ageGroup] = {};
          }
          ageBreakdown[vote.ageGroup][vote.option] =
            (ageBreakdown[vote.ageGroup][vote.option] || 0) + 1;
        }
      });
      stats.breakdown.age = ageBreakdown;
    }

    if (!filterBy || filterBy === 'gender') {
      // 性別別集計
      const genderBreakdown: Record<string, Record<number, number>> = {};
      poll.votes.forEach((vote) => {
        if (vote.gender) {
          if (!genderBreakdown[vote.gender]) {
            genderBreakdown[vote.gender] = {};
          }
          genderBreakdown[vote.gender][vote.option] =
            (genderBreakdown[vote.gender][vote.option] || 0) + 1;
        }
      });
      stats.breakdown.gender = genderBreakdown;
    }

    if (!filterBy || filterBy === 'prefecture') {
      // 都道府県別集計
      const prefectureBreakdown: Record<string, Record<number, number>> = {};
      poll.votes.forEach((vote) => {
        if (!prefectureBreakdown[vote.prefecture]) {
          prefectureBreakdown[vote.prefecture] = {};
        }
        prefectureBreakdown[vote.prefecture][vote.option] =
          (prefectureBreakdown[vote.prefecture][vote.option] || 0) + 1;
      });
      stats.breakdown.prefecture = prefectureBreakdown;
    }

    return stats;
  }
}