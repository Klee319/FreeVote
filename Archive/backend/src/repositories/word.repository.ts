import { PrismaClient, Word, Prisma } from '../generated/prisma';
import { AppError } from '../utils/errors';

export interface SearchWordsParams {
  query?: string;
  categoryId?: number;
  status?: string;
  limit?: number;
  offset?: number;
  sort?: 'latest' | 'popular' | 'alphabetic';
}

export class WordRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 語を検索
   */
  async searchWords(params: SearchWordsParams) {
    const {
      query,
      categoryId,
      status = 'approved',
      limit = 20,
      offset = 0,
      sort = 'latest',
    } = params;

    const where: Prisma.WordWhereInput = {
      status,
      ...(categoryId && { categoryId }),
      ...(query && {
        OR: [
          { headword: { contains: query, mode: 'insensitive' } },
          { reading: { contains: query, mode: 'insensitive' } },
          {
            aliases: {
              some: { alias: { contains: query, mode: 'insensitive' } },
            },
          },
        ],
      }),
    };

    let orderBy: Prisma.WordOrderByWithRelationInput = {};
    if (sort === 'latest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'alphabetic') {
      orderBy = { reading: 'asc' };
    } else if (sort === 'popular') {
      // 人気順の場合は投票数でソート（後で実装）
      orderBy = { createdAt: 'desc' };
    }

    const [words, total] = await Promise.all([
      this.prisma.word.findMany({
        where,
        include: {
          category: true,
          aliases: true,
          accentOptions: {
            include: { accentType: true },
          },
          _count: {
            select: { votes: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.word.count({ where }),
    ]);

    // 人気順の場合は投票数でソート
    if (sort === 'popular') {
      words.sort((a, b) => b._count.votes - a._count.votes);
    }

    return { words, total };
  }

  /**
   * IDで語を取得
   */
  async getWordById(id: number): Promise<Word | null> {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: {
        category: true,
        aliases: true,
        accentOptions: {
          include: { accentType: true },
        },
        submitter: {
          select: {
            id: true,
            displayName: true,
          },
        },
        approver: {
          select: {
            id: true,
            displayName: true,
          },
        },
        nationalStats: {
          include: { accentType: true },
          orderBy: { voteCount: 'desc' },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    return word;
  }

  /**
   * 新語を投稿
   */
  async createSubmission(data: {
    headword: string;
    reading: string;
    categoryId?: number;
    aliases?: string[];
    submittedBy?: string;
    initialAccentTypeId?: number;
    prefectureCode?: string;
    ageGroup?: string;
  }) {
    // 重複チェック
    const existing = await this.prisma.word.findFirst({
      where: {
        headword: data.headword,
        reading: data.reading,
      },
    });

    if (existing) {
      throw new AppError('この語は既に登録されています', 409);
    }

    // 投稿を作成
    const submission = await this.prisma.submission.create({
      data: {
        headword: data.headword,
        reading: data.reading,
        categoryId: data.categoryId,
        aliases: data.aliases?.join(','),
        submittedBy: data.submittedBy,
        initialAccentTypeId: data.initialAccentTypeId,
        prefectureCode: data.prefectureCode,
        ageGroup: data.ageGroup,
        status: 'pending',
      },
      include: {
        category: true,
        initialAccentType: true,
        submitter: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return submission;
  }

  /**
   * 新着語を取得
   */
  async getRecentWords(limit: number = 20, offset: number = 0) {
    const words = await this.prisma.word.findMany({
      where: { status: 'approved' },
      include: {
        category: true,
        accentOptions: {
          include: { accentType: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return words;
  }

  /**
   * カテゴリ別の語を取得
   */
  async getWordsByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
    const words = await this.prisma.word.findMany({
      where: {
        categoryId,
        status: 'approved',
      },
      include: {
        category: true,
        accentOptions: {
          include: { accentType: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return words;
  }

  /**
   * ランダムな語を取得
   */
  async getRandomWords(limit: number = 10) {
    // PostgreSQLのRANDOM()を使用してランダムに取得
    const words = await this.prisma.$queryRaw<Word[]>`
      SELECT w.*, 
             COUNT(v.id) as vote_count
      FROM words w
      LEFT JOIN votes v ON w.id = v.word_id
      WHERE w.status = 'approved'
      GROUP BY w.id
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    return words;
  }

  /**
   * 語の統計を更新
   */
  async updateWordStats(wordId: number) {
    // 全国統計を再集計
    const nationalStats = await this.prisma.vote.groupBy({
      by: ['accentTypeId'],
      where: { wordId },
      _count: { id: true },
    });

    const totalVotes = nationalStats.reduce((sum, s) => sum + s._count.id, 0);

    // 統計を更新または作成
    for (const stat of nationalStats) {
      const percentage = totalVotes > 0 ? (stat._count.id / totalVotes) * 100 : 0;

      await this.prisma.wordNationalStats.upsert({
        where: {
          wordId_accentTypeId: {
            wordId,
            accentTypeId: stat.accentTypeId,
          },
        },
        update: {
          voteCount: stat._count.id,
          votePercentage: percentage,
          totalVotes,
        },
        create: {
          wordId,
          accentTypeId: stat.accentTypeId,
          voteCount: stat._count.id,
          votePercentage: percentage,
          totalVotes,
        },
      });
    }
  }

  /**
   * アクセントオプションを取得
   */
  async getAccentOptions(wordId: number) {
    return await this.prisma.accentOption.findMany({
      where: { wordId },
      include: { accentType: true },
      orderBy: { accentTypeId: 'asc' },
    });
  }

  /**
   * 全国統計を取得
   */
  async getNationalStats(wordId: number) {
    return await this.prisma.wordNationalStats.findMany({
      where: { wordId },
      include: { accentType: true },
      orderBy: { voteCount: 'desc' },
    });
  }

  /**
   * 都道府県統計を取得
   */
  async getPrefectureStats(wordId: number, prefectureCode?: string) {
    return await this.prisma.wordPrefStats.findMany({
      where: {
        wordId,
        ...(prefectureCode && { prefectureCode }),
      },
      include: {
        accentType: true,
        prefecture: true,
      },
      orderBy: { voteCount: 'desc' },
    });
  }

  /**
   * 語の総投票数を取得（リアルタイムで計算）
   */
  async getTotalVotes(wordId: number): Promise<number> {
    const result = await this.prisma.vote.count({
      where: { wordId },
    });
    return result;
  }
}