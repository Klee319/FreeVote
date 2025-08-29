import { PrismaClient, Prisma } from '../generated/prisma';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export interface RankingParams {
  prefectureCode?: string;
  period?: '7d' | '30d' | 'all';
  limit?: number;
  offset?: number;
  ageGroup?: string;
  gender?: string;
}

export interface RankingItem {
  rank: number;
  wordId: number;
  headword: string;
  reading: string;
  totalVotes: number;
  uniqueVoters: number;
  mostVotedAccentType: {
    id: number;
    code: string;
    name: string;
    votePercentage: number;
  };
  previousRank?: number;
  rankChange?: number;
}

export interface RankingResult {
  prefecture?: {
    code: string;
    name: string;
    region: string;
  };
  period: string;
  items: RankingItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  summary: {
    totalVotes: number;
    uniqueWords: number;
    participantCount: number;
    lastUpdated: string;
  };
}

export interface ComparisonResult {
  prefectures: Array<{
    code: string;
    name: string;
    region: string;
  }>;
  comparison: {
    words: Array<{
      wordId: number;
      headword: string;
      reading: string;
      rankings: Array<{
        prefectureCode: string;
        rank: number;
        voteCount: number;
        accentType: string;
      }>;
    }>;
  };
  insights: Array<{
    type: string;
    message: string;
    data?: any;
  }>;
}

export class RankingService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis | null
  ) {}

  /**
   * 都道府県別ランキングを取得
   */
  async getPrefectureRanking(params: RankingParams): Promise<RankingResult> {
    const {
      prefectureCode,
      period = '30d',
      limit = 20,
      offset = 0,
      ageGroup,
      gender
    } = params;

    // キャッシュキー生成
    const cacheKey = this.generateCacheKey('ranking', params);
    
    // キャッシュ確認
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          logger.info('Ranking cache hit', { cacheKey });
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.error('Redis cache error', error);
      }
    }

    // 期間に応じた日付フィルター
    const dateFilter = this.getDateFilter(period);
    
    // 都道府県情報取得
    let prefectureInfo = null;
    if (prefectureCode) {
      prefectureInfo = await this.prisma.prefecture.findUnique({
        where: { code: prefectureCode },
      });
    }

    // ランキングデータ取得（Raw SQL使用）
    const rankingData = await this.getRankingData({
      prefectureCode,
      dateFilter,
      ageGroup,
      gender,
      limit,
      offset
    });

    // 集計統計取得
    const summary = await this.getRankingSummary({
      prefectureCode,
      dateFilter,
      ageGroup,
      gender
    });

    // 結果整形
    const result: RankingResult = {
      prefecture: prefectureInfo ? {
        code: prefectureInfo.code,
        name: prefectureInfo.name,
        region: prefectureInfo.region,
      } : undefined,
      period,
      items: rankingData.items,
      pagination: {
        total: rankingData.total,
        limit,
        offset,
        hasNext: offset + limit < rankingData.total
      },
      summary: {
        totalVotes: summary.totalVotes,
        uniqueWords: summary.uniqueWords,
        participantCount: summary.participantCount,
        lastUpdated: new Date().toISOString()
      }
    };

    // キャッシュ保存（5分間）
    if (this.redis) {
      try {
        await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      } catch (error) {
        logger.error('Redis cache save error', error);
      }
    }
    
    return result;
  }

  /**
   * 複数都道府県の比較データ取得
   */
  async getComparisonData(prefectureCodes: string[]): Promise<ComparisonResult> {
    if (prefectureCodes.length > 3) {
      throw new Error('最大3つの都道府県まで比較可能です');
    }

    // キャッシュキー生成
    const cacheKey = `comparison:${prefectureCodes.sort().join(':')}`;
    
    // キャッシュ確認
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.error('Redis cache error', error);
      }
    }

    // 都道府県情報取得
    const prefectures = await this.prisma.prefecture.findMany({
      where: {
        code: { in: prefectureCodes }
      }
    });

    // 各都道府県のランキングデータ取得
    const rankings = await Promise.all(
      prefectureCodes.map(code => 
        this.getPrefectureRanking({ 
          prefectureCode: code, 
          period: '30d', 
          limit: 20, 
          offset: 0 
        })
      )
    );

    // 比較データ整形
    const comparisonWords = new Map<number, any>();
    
    rankings.forEach((ranking, index) => {
      const prefCode = prefectureCodes[index];
      ranking.items.forEach(item => {
        if (!comparisonWords.has(item.wordId)) {
          comparisonWords.set(item.wordId, {
            wordId: item.wordId,
            headword: item.headword,
            reading: item.reading,
            rankings: []
          });
        }
        
        comparisonWords.get(item.wordId).rankings.push({
          prefectureCode: prefCode,
          rank: item.rank,
          voteCount: item.totalVotes,
          accentType: item.mostVotedAccentType.code
        });
      });
    });

    // インサイト生成
    const insights = this.generateComparisonInsights(
      Array.from(comparisonWords.values()),
      prefectures
    );

    const result: ComparisonResult = {
      prefectures: prefectures.map(p => ({
        code: p.code,
        name: p.name,
        region: p.region
      })),
      comparison: {
        words: Array.from(comparisonWords.values())
      },
      insights
    };

    // キャッシュ保存（10分間）
    if (this.redis) {
      try {
        await this.redis.setex(cacheKey, 600, JSON.stringify(result));
      } catch (error) {
        logger.error('Redis cache save error', error);
      }
    }

    return result;
  }

  /**
   * ランキングデータ取得（Raw SQL）
   */
  private async getRankingData(params: {
    prefectureCode?: string;
    dateFilter?: Date;
    ageGroup?: string;
    gender?: string;
    limit: number;
    offset: number;
  }) {
    const { prefectureCode, dateFilter, ageGroup, gender, limit, offset } = params;

    // WHERE句構築
    const whereConditions: string[] = ['1=1'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (prefectureCode) {
      whereConditions.push(`v.prefecture_code = $${paramIndex++}`);
      queryParams.push(prefectureCode);
    }

    if (dateFilter) {
      whereConditions.push(`v.created_at >= $${paramIndex++}`);
      queryParams.push(dateFilter);
    }

    if (ageGroup) {
      whereConditions.push(`v.age_group = $${paramIndex++}`);
      queryParams.push(ageGroup);
    }

    if (gender) {
      whereConditions.push(`u.gender = $${paramIndex++}`);
      queryParams.push(gender);
    }

    const whereClause = whereConditions.join(' AND ');

    // メインクエリ
    const query = `
      WITH word_vote_stats AS (
        SELECT 
          w.id,
          w.headword,
          w.reading,
          COUNT(v.id) as total_votes,
          COUNT(DISTINCT v.device_id) as unique_voters,
          MODE() WITHIN GROUP (ORDER BY v.accent_type_id) as most_voted_accent_type_id
        FROM words w
        LEFT JOIN votes v ON w.id = v.word_id
        LEFT JOIN users u ON v.user_id = u.id
        WHERE ${whereClause}
        GROUP BY w.id, w.headword, w.reading
        HAVING COUNT(v.id) >= 10
      ),
      ranked_words AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (ORDER BY total_votes DESC, unique_voters DESC) as rank
        FROM word_vote_stats
      )
      SELECT 
        rw.*,
        at.code as accent_type_code,
        at.name as accent_type_name,
        ROUND(
          (rw.total_votes::numeric / NULLIF(SUM(rw.total_votes) OVER(), 0)) * 100,
          2
        ) as vote_percentage
      FROM ranked_words rw
      LEFT JOIN accent_types at ON rw.most_voted_accent_type_id = at.id
      ORDER BY rw.rank
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    queryParams.push(limit, offset);

    const items = await this.prisma.$queryRawUnsafe<any[]>(query, ...queryParams);

    // 総数取得
    const countQuery = `
      SELECT COUNT(DISTINCT w.id) as total
      FROM words w
      LEFT JOIN votes v ON w.id = v.word_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE ${whereClause}
        AND w.id IN (
          SELECT word_id 
          FROM votes 
          GROUP BY word_id 
          HAVING COUNT(*) >= 10
        )
    `;

    const countResult = await this.prisma.$queryRawUnsafe<any[]>(
      countQuery,
      ...queryParams.slice(0, -2)
    );
    const total = countResult[0]?.total || 0;

    // 結果整形
    const formattedItems: RankingItem[] = items.map((item) => ({
      rank: Number(item.rank),
      wordId: item.id,
      headword: item.headword,
      reading: item.reading,
      totalVotes: Number(item.total_votes),
      uniqueVoters: Number(item.unique_voters),
      mostVotedAccentType: {
        id: item.most_voted_accent_type_id,
        code: item.accent_type_code,
        name: item.accent_type_name,
        votePercentage: Number(item.vote_percentage)
      }
    }));

    return {
      items: formattedItems,
      total: Number(total)
    };
  }

  /**
   * ランキング集計統計取得
   */
  private async getRankingSummary(params: {
    prefectureCode?: string;
    dateFilter?: Date;
    ageGroup?: string;
    gender?: string;
  }) {
    const { prefectureCode, dateFilter, ageGroup, gender } = params;

    const whereConditions: Prisma.VoteWhereInput = {};

    if (prefectureCode) {
      whereConditions.prefectureCode = prefectureCode;
    }

    if (dateFilter) {
      whereConditions.createdAt = { gte: dateFilter };
    }

    if (ageGroup) {
      whereConditions.ageGroup = ageGroup;
    }

    if (gender) {
      whereConditions.user = { gender };
    }

    const [voteStats, uniqueWords, uniqueDevices] = await Promise.all([
      this.prisma.vote.count({
        where: whereConditions
      }),
      this.prisma.vote.groupBy({
        by: ['wordId'],
        where: whereConditions,
        _count: true
      }),
      this.prisma.vote.groupBy({
        by: ['deviceId'],
        where: whereConditions,
        _count: true
      })
    ]);

    return {
      totalVotes: voteStats,
      uniqueWords: uniqueWords.length,
      participantCount: uniqueDevices.length
    };
  }

  /**
   * 比較インサイト生成
   */
  private generateComparisonInsights(
    comparisonWords: any[],
    prefectures: any[]
  ): Array<{ type: string; message: string; data?: any }> {
    const insights: Array<{ type: string; message: string; data?: any }> = [];

    // 地域差が大きい語を検出
    comparisonWords.forEach(word => {
      if (word.rankings.length >= 2) {
        const accentTypes = word.rankings.map((r: any) => r.accentType);
        const uniqueAccents = [...new Set(accentTypes)];
        
        if (uniqueAccents.length > 1) {
          insights.push({
            type: 'regional_difference',
            message: `「${word.headword}」は地域によってアクセントが異なります`,
            data: {
              word: word.headword,
              accents: word.rankings.map((r: any) => ({
                prefecture: prefectures.find(p => p.code === r.prefectureCode)?.name,
                accent: r.accentType
              }))
            }
          });
        }
      }
    });

    // 共通して人気の語を検出
    const commonWords = comparisonWords.filter(word => 
      word.rankings.length === prefectures.length &&
      word.rankings.every((r: any) => r.rank <= 10)
    );

    if (commonWords.length > 0) {
      insights.push({
        type: 'common_popular',
        message: `${commonWords.length}語が全ての地域で上位にランクイン`,
        data: {
          words: commonWords.map(w => w.headword)
        }
      });
    }

    return insights;
  }

  /**
   * 期間フィルター生成
   */
  private getDateFilter(period: string): Date | undefined {
    const now = new Date();
    
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return undefined;
    }
  }

  /**
   * キャッシュキー生成
   */
  private generateCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {} as any);
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * CSVエクスポート用データ生成
   */
  async generateCSVData(params: RankingParams): Promise<string> {
    const ranking = await this.getPrefectureRanking(params);
    
    // ヘッダー行
    const headers = [
      '順位',
      '語',
      '読み',
      '総投票数',
      'ユニーク投票者数',
      '最多アクセント型',
      'アクセント型投票率(%)'
    ];

    // データ行
    const rows = ranking.items.map(item => [
      item.rank,
      item.headword,
      item.reading,
      item.totalVotes,
      item.uniqueVoters,
      item.mostVotedAccentType.name,
      item.mostVotedAccentType.votePercentage
    ]);

    // CSV形式に変換
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}