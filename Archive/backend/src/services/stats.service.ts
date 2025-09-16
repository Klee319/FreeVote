/**
 * 統計サービス
 */

import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { Prefecture } from '../domain/value-objects/prefecture';
import type {
  PrefectureAccentStats,
  WordMapStatsResponse,
  PrefectureAllWordsStatsResponse,
  MapOverviewStatsResponse,
  AccentClusterAnalysis,
  AccentDistribution,
} from '../types/map.types';

export class StatsService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * 語の都道府県別統計を取得
   */
  async getWordPrefectureStats(wordId: number, prefecture?: string) {
    try {
      // 語の存在確認
      const word = await this.prisma.word.findUnique({
        where: { id: wordId },
        include: { category: true }
      });
      
      if (!word) {
        return null;
      }
      
      // 都道府県別統計を取得
      const whereCondition: any = { wordId };
      if (prefecture) {
        whereCondition.prefectureCode = prefecture;
      }
      
      const stats = await this.prisma.wordPrefStats.findMany({
        where: whereCondition,
        include: {
          prefecture: true,
          accentType: true,
        },
        orderBy: [
          { prefectureCode: 'asc' },
          { voteCount: 'desc' },
        ],
      });
      
      // 都道府県ごとにグループ化
      const prefectureMap = new Map<string, any>();
      
      for (const stat of stats) {
        const code = stat.prefectureCode;
        if (!prefectureMap.has(code)) {
          prefectureMap.set(code, {
            prefecture: stat.prefecture,
            totalVotes: stat.totalVotesInPref,
            accentDistribution: [],
          });
        }
        
        prefectureMap.get(code)!.accentDistribution.push({
          accentType: stat.accentType,
          voteCount: stat.voteCount,
          percentage: parseFloat(stat.votePercentage.toString()),
        });
      }
      
      // 全国統計も取得
      const nationalStats = await this.prisma.wordNationalStats.findMany({
        where: { wordId },
        include: { accentType: true },
        orderBy: { voteCount: 'desc' },
      });
      
      return {
        word,
        national: {
          totalVotes: nationalStats.reduce((sum, s) => sum + s.totalVotes, 0) / nationalStats.length || 0,
          distribution: nationalStats.map((s) => ({
            accentType: s.accentType,
            voteCount: s.voteCount,
            percentage: parseFloat(s.votePercentage.toString()),
          })),
        },
        byPrefecture: Array.from(prefectureMap.values()),
      };
    } catch (error) {
      logger.error('Error getting word prefecture stats:', error);
      throw new AppError('統計データの取得に失敗しました', 500, 'STATS_FETCH_ERROR');
    }
  }
  
  /**
   * 語の統計を取得
   */
  async getWordStats(wordId: number) {
    try {
      // 語の存在確認
      const word = await this.prisma.word.findUnique({
        where: { id: wordId },
        include: { 
          category: true,
          votes: {
            include: {
              accentType: true,
              prefecture: true,
            }
          }
        }
      });
      
      if (!word) {
        return null;
      }
      
      // アクセント型別の集計
      const accentDistribution = new Map<number, { type: any; count: number }>();
      const prefectureDistribution = new Map<string, { prefecture: any; count: number }>();
      const ageDistribution = new Map<string, number>();
      
      for (const vote of word.votes) {
        // アクセント型別
        const accentId = vote.accentTypeId;
        if (!accentDistribution.has(accentId)) {
          accentDistribution.set(accentId, { type: vote.accentType, count: 0 });
        }
        accentDistribution.get(accentId)!.count++;
        
        // 都道府県別
        if (vote.prefectureCode) {
          if (!prefectureDistribution.has(vote.prefectureCode)) {
            prefectureDistribution.set(vote.prefectureCode, { prefecture: vote.prefecture, count: 0 });
          }
          prefectureDistribution.get(vote.prefectureCode)!.count++;
        }
        
        // 年齢層別
        if (vote.ageGroup) {
          if (!ageDistribution.has(vote.ageGroup)) {
            ageDistribution.set(vote.ageGroup, 0);
          }
          ageDistribution.set(vote.ageGroup, ageDistribution.get(vote.ageGroup)! + 1);
        }
      }
      
      const totalVotes = word.votes.length;
      
      return {
        word: {
          id: word.id,
          headword: word.headword,
          reading: word.reading,
          category: word.category,
        },
        totalVotes,
        accentDistribution: Array.from(accentDistribution.values()).map(item => ({
          accentType: item.type,
          count: item.count,
          percentage: totalVotes > 0 ? (item.count / totalVotes) * 100 : 0,
        })),
        prefectureDistribution: Array.from(prefectureDistribution.values()).map(item => ({
          prefecture: item.prefecture,
          count: item.count,
          percentage: totalVotes > 0 ? (item.count / totalVotes) * 100 : 0,
        })),
        ageDistribution: Array.from(ageDistribution.entries()).map(([ageGroup, count]) => ({
          ageGroup,
          count,
          percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
        })),
      };
    } catch (error) {
      logger.error('Error getting word stats:', error);
      throw new AppError('統計データの取得に失敗しました', 500, 'STATS_FETCH_ERROR');
    }
  }
  
  /**
   * 都道府県の統計を取得
   */
  async getPrefectureStats(prefectureCode: string) {
    try {
      const prefecture = await this.prisma.prefecture.findUnique({
        where: { code: prefectureCode },
      });
      
      if (!prefecture) {
        return null;
      }
      
      // 投票数統計
      const totalVotes = await this.prisma.vote.count({
        where: { prefectureCode }
      });
      
      // 人気の語TOP10
      const popularWords = await this.prisma.vote.groupBy({
        by: ['wordId'],
        where: { prefectureCode },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });
      
      const wordIds = popularWords.map(w => w.wordId);
      const words = await this.prisma.word.findMany({
        where: { id: { in: wordIds } },
        include: { category: true },
      });
      
      const popularWordsWithDetails = popularWords.map(pw => {
        const word = words.find(w => w.id === pw.wordId);
        return {
          word,
          voteCount: pw._count.id,
        };
      });
      
      // アクセント型の傾向
      const accentTrends = await this.prisma.vote.groupBy({
        by: ['accentTypeId'],
        where: { prefectureCode },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });
      
      const accentTypes = await this.prisma.accentType.findMany({
        where: { id: { in: accentTrends.map(a => a.accentTypeId) } },
      });
      
      const accentTrendsWithDetails = accentTrends.map(at => {
        const type = accentTypes.find(t => t.id === at.accentTypeId);
        return {
          accentType: type,
          voteCount: at._count.id,
          percentage: totalVotes > 0 ? (at._count.id / totalVotes) * 100 : 0,
        };
      });
      
      return {
        prefecture,
        totalVotes,
        popularWords: popularWordsWithDetails,
        accentTrends: accentTrendsWithDetails,
      };
    } catch (error) {
      logger.error('Error getting prefecture stats:', error);
      throw new AppError('都道府県統計の取得に失敗しました', 500, 'PREFECTURE_STATS_ERROR');
    }
  }
  
  /**
   * サイト全体の統計を取得
   */
  async getSiteStats() {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 統計を集計
      const [
        totalWords,
        totalVotes,
        totalUsers,
        todayVotes,
        weekVotes,
        monthVotes,
        activeWords,
      ] = await Promise.all([
        this.prisma.word.count({ where: { status: 'approved' } }),
        this.prisma.vote.count(),
        this.prisma.user.count(),
        this.prisma.vote.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.vote.count({ where: { createdAt: { gte: startOfWeek } } }),
        this.prisma.vote.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.vote.groupBy({
          by: ['wordId'],
          where: { createdAt: { gte: startOfWeek } },
          _count: true,
        }).then((r) => r.length),
      ]);
      
      return {
        overview: {
          totalWords,
          totalVotes,
          totalUsers,
          activeWords,
        },
        activity: {
          today: todayVotes,
          thisWeek: weekVotes,
          thisMonth: monthVotes,
        },
      };
    } catch (error) {
      logger.error('Error getting site stats:', error);
      throw new AppError('サイト統計の取得に失敗しました', 500, 'SITE_STATS_ERROR');
    }
  }

  /**
   * 語の地図統計を取得
   */
  async getWordMapStats(wordId: number): Promise<WordMapStatsResponse | null> {
    try {
      // 語の存在確認
      const word = await this.prisma.word.findUnique({
        where: { id: wordId },
        include: { category: true }
      });
      
      if (!word) {
        return null;
      }

      // 都道府県別の投票を集計
      const votes = await this.prisma.vote.findMany({
        where: { wordId },
        include: {
          accentType: true,
          prefecture: true,
        }
      });

      // 都道府県ごとに集計
      const prefectureMap = new Map<string, {
        votes: Array<{ accentTypeId: number; accentTypeName: string }>;
        prefectureName: string;
      }>();

      // 全都道府県を初期化
      Prefecture.getAll().forEach(pref => {
        prefectureMap.set(pref.getCode(), {
          votes: [],
          prefectureName: pref.getName(),
        });
      });

      // 投票データを集計
      votes.forEach(vote => {
        if (vote.prefectureCode && prefectureMap.has(vote.prefectureCode)) {
          prefectureMap.get(vote.prefectureCode)!.votes.push({
            accentTypeId: vote.accentTypeId,
            accentTypeName: vote.accentType.name,
          });
        }
      });

      // 都道府県別統計を作成
      const prefectureStats: PrefectureAccentStats[] = [];
      
      Prefecture.getAll().forEach(pref => {
        const prefData = prefectureMap.get(pref.getCode())!;
        const totalVotes = prefData.votes.length;
        
        // アクセントタイプ別に集計
        const accentCounts = new Map<number, { name: string; count: number }>();
        prefData.votes.forEach(vote => {
          if (!accentCounts.has(vote.accentTypeId)) {
            accentCounts.set(vote.accentTypeId, { name: vote.accentTypeName, count: 0 });
          }
          accentCounts.get(vote.accentTypeId)!.count++;
        });

        // 最多投票のアクセントタイプを特定
        let dominantAccentTypeId: number | null = null;
        let dominantAccentTypeName: string | null = null;
        let maxCount = 0;
        
        accentCounts.forEach((value, id) => {
          if (value.count > maxCount) {
            maxCount = value.count;
            dominantAccentTypeId = id;
            dominantAccentTypeName = value.name;
          }
        });

        // 分布データを作成
        const distribution: AccentDistribution[] = Array.from(accentCounts.entries()).map(([id, data]) => ({
          accentTypeId: id,
          accentTypeName: data.name,
          voteCount: data.count,
          percentage: totalVotes > 0 ? (data.count / totalVotes) * 100 : 0,
        }));

        prefectureStats.push({
          prefectureCode: pref.getCode(),
          prefectureName: pref.getName(),
          region: pref.getRegion(),
          dominantAccentTypeId: totalVotes >= 10 ? dominantAccentTypeId : null,
          dominantAccentTypeName: totalVotes >= 10 ? dominantAccentTypeName : null,
          totalVotes,
          hasEnoughData: totalVotes >= 10,
          distribution,
        });
      });

      // 全国統計を計算
      const allAccentCounts = new Map<number, { name: string; count: number }>();
      votes.forEach(vote => {
        if (!allAccentCounts.has(vote.accentTypeId)) {
          allAccentCounts.set(vote.accentTypeId, { name: vote.accentType.name, count: 0 });
        }
        allAccentCounts.get(vote.accentTypeId)!.count++;
      });

      let nationalDominantId: number | null = null;
      let nationalDominantName: string | null = null;
      let nationalMaxCount = 0;
      
      allAccentCounts.forEach((value, id) => {
        if (value.count > nationalMaxCount) {
          nationalMaxCount = value.count;
          nationalDominantId = id;
          nationalDominantName = value.name;
        }
      });

      const nationalDistribution: AccentDistribution[] = Array.from(allAccentCounts.entries()).map(([id, data]) => ({
        accentTypeId: id,
        accentTypeName: data.name,
        voteCount: data.count,
        percentage: votes.length > 0 ? (data.count / votes.length) * 100 : 0,
      }));

      return {
        wordId: word.id,
        headword: word.headword,
        reading: word.reading,
        category: {
          id: word.category.id,
          name: word.category.name,
        },
        prefectureStats,
        nationalSummary: {
          totalVotes: votes.length,
          dominantAccentTypeId: nationalDominantId,
          dominantAccentTypeName: nationalDominantName,
          distribution: nationalDistribution,
        },
      };
    } catch (error) {
      logger.error('Error getting word map stats:', error);
      throw new AppError('地図統計データの取得に失敗しました', 500, 'MAP_STATS_ERROR');
    }
  }

  /**
   * 都道府県別全語統計を取得
   */
  async getPrefectureAllWordsStats(prefectureCode: string): Promise<PrefectureAllWordsStatsResponse | null> {
    try {
      // 都道府県の存在確認
      const prefecture = Prefecture.fromCode(prefectureCode);
      
      // 該当都道府県の全投票を取得
      const votes = await this.prisma.vote.findMany({
        where: { prefectureCode },
        include: {
          accentType: true,
          word: {
            include: { category: true }
          }
        }
      });

      if (votes.length === 0) {
        return {
          prefectureCode,
          prefectureName: prefecture.getName(),
          region: prefecture.getRegion(),
          totalVotes: 0,
          accentTrends: [],
          topWords: [],
        };
      }

      // アクセントタイプ別集計
      const accentCounts = new Map<number, {
        name: string;
        count: number;
        words: Set<number>;
      }>();

      // 語別集計
      const wordCounts = new Map<number, {
        headword: string;
        reading: string;
        count: number;
        accentCounts: Map<number, { name: string; count: number }>;
      }>();

      votes.forEach(vote => {
        // アクセントタイプ別
        if (!accentCounts.has(vote.accentTypeId)) {
          accentCounts.set(vote.accentTypeId, {
            name: vote.accentType.name,
            count: 0,
            words: new Set(),
          });
        }
        const accentData = accentCounts.get(vote.accentTypeId)!;
        accentData.count++;
        accentData.words.add(vote.wordId);

        // 語別
        if (!wordCounts.has(vote.wordId)) {
          wordCounts.set(vote.wordId, {
            headword: vote.word.headword,
            reading: vote.word.reading,
            count: 0,
            accentCounts: new Map(),
          });
        }
        const wordData = wordCounts.get(vote.wordId)!;
        wordData.count++;
        
        if (!wordData.accentCounts.has(vote.accentTypeId)) {
          wordData.accentCounts.set(vote.accentTypeId, {
            name: vote.accentType.name,
            count: 0,
          });
        }
        wordData.accentCounts.get(vote.accentTypeId)!.count++;
      });

      // アクセントタイプ傾向を作成
      const accentTrends = Array.from(accentCounts.entries())
        .map(([id, data]) => ({
          accentTypeId: id,
          accentTypeName: data.name,
          voteCount: data.count,
          percentage: (data.count / votes.length) * 100,
          wordCount: data.words.size,
        }))
        .sort((a, b) => b.voteCount - a.voteCount);

      // 人気の語トップ10を作成
      const topWords = Array.from(wordCounts.entries())
        .map(([id, data]) => {
          // 最多投票のアクセントタイプを特定
          let dominantId = 0;
          let dominantName = '';
          let maxCount = 0;
          
          data.accentCounts.forEach((accentData, accentId) => {
            if (accentData.count > maxCount) {
              maxCount = accentData.count;
              dominantId = accentId;
              dominantName = accentData.name;
            }
          });

          return {
            wordId: id,
            headword: data.headword,
            reading: data.reading,
            voteCount: data.count,
            dominantAccentTypeId: dominantId,
            dominantAccentTypeName: dominantName,
          };
        })
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 10);

      return {
        prefectureCode,
        prefectureName: prefecture.getName(),
        region: prefecture.getRegion(),
        totalVotes: votes.length,
        accentTrends,
        topWords,
      };
    } catch (error) {
      logger.error('Error getting prefecture all words stats:', error);
      throw new AppError('都道府県別統計の取得に失敗しました', 500, 'PREFECTURE_STATS_ERROR');
    }
  }

  /**
   * 全国概要統計を取得
   */
  async getMapOverviewStats(): Promise<MapOverviewStatsResponse> {
    try {
      // 基本統計を取得
      const [totalWords, totalVotes, prefectureVoteCounts] = await Promise.all([
        this.prisma.word.count({ where: { status: 'approved' } }),
        this.prisma.vote.count(),
        this.prisma.vote.groupBy({
          by: ['prefectureCode'],
          _count: { id: true },
        }),
      ]);

      const prefecturesWithData = prefectureVoteCounts.filter(p => p._count.id >= 10).length;

      // 地域別統計を取得
      const regionVotes = await this.prisma.vote.findMany({
        include: {
          accentType: true,
          prefecture: true,
        }
      });

      // 地域別に集計
      const regionMap = new Map<string, {
        votes: Array<{ accentTypeId: number; accentTypeName: string }>;
        prefectures: Set<string>;
      }>();

      regionVotes.forEach(vote => {
        if (vote.prefectureCode) {
          try {
            const pref = Prefecture.fromCode(vote.prefectureCode);
            const region = pref.getRegion();
            
            if (!regionMap.has(region)) {
              regionMap.set(region, {
                votes: [],
                prefectures: new Set(),
              });
            }
            
            const regionData = regionMap.get(region)!;
            regionData.votes.push({
              accentTypeId: vote.accentTypeId,
              accentTypeName: vote.accentType.name,
            });
            regionData.prefectures.add(pref.getName());
          } catch (e) {
            // 無効な都道府県コードは無視
          }
        }
      });

      // 地域別傾向を作成
      const regionalTrends = Array.from(regionMap.entries()).map(([region, data]) => {
        const accentCounts = new Map<number, { name: string; count: number }>();
        
        data.votes.forEach(vote => {
          if (!accentCounts.has(vote.accentTypeId)) {
            accentCounts.set(vote.accentTypeId, { name: vote.accentTypeName, count: 0 });
          }
          accentCounts.get(vote.accentTypeId)!.count++;
        });

        let dominantId: number | null = null;
        let dominantName: string | null = null;
        let maxCount = 0;
        
        accentCounts.forEach((value, id) => {
          if (value.count > maxCount) {
            maxCount = value.count;
            dominantId = id;
            dominantName = value.name;
          }
        });

        return {
          region,
          totalVotes: data.votes.length,
          dominantAccentTypeId: dominantId,
          dominantAccentTypeName: dominantName,
          prefectures: Array.from(data.prefectures),
        };
      });

      // 最も投票の多い語を取得
      const mostVoted = await this.prisma.vote.groupBy({
        by: ['wordId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const wordIds = mostVoted.map(w => w.wordId);
      const words = await this.prisma.word.findMany({
        where: { id: { in: wordIds } },
      });

      const mostVotedWords = mostVoted.map(mv => {
        const word = words.find(w => w.id === mv.wordId);
        return {
          wordId: mv.wordId,
          headword: word?.headword || '',
          reading: word?.reading || '',
          totalVotes: mv._count.id,
        };
      });

      return {
        lastUpdated: new Date(),
        summary: {
          totalWords,
          totalVotes,
          totalPrefectures: 47,
          prefecturesWithData,
        },
        regionalTrends,
        mostVotedWords,
      };
    } catch (error) {
      logger.error('Error getting map overview stats:', error);
      throw new AppError('全国概要統計の取得に失敗しました', 500, 'OVERVIEW_STATS_ERROR');
    }
  }

  /**
   * 地域クラスター分析を取得
   */
  async getAccentClusterAnalysis(wordId: number): Promise<AccentClusterAnalysis | null> {
    try {
      // 語の存在確認
      const word = await this.prisma.word.findUnique({
        where: { id: wordId },
      });
      
      if (!word) {
        return null;
      }

      // 都道府県別の投票を取得
      const votes = await this.prisma.vote.findMany({
        where: { wordId },
        include: {
          accentType: true,
          prefecture: true,
        }
      });

      // 都道府県別アクセント分布を計算
      const prefectureDistributions = new Map<string, Map<number, number>>();
      
      Prefecture.getAll().forEach(pref => {
        prefectureDistributions.set(pref.getCode(), new Map());
      });

      votes.forEach(vote => {
        if (vote.prefectureCode && prefectureDistributions.has(vote.prefectureCode)) {
          const dist = prefectureDistributions.get(vote.prefectureCode)!;
          dist.set(vote.accentTypeId, (dist.get(vote.accentTypeId) || 0) + 1);
        }
      });

      // 類似度に基づくクラスタリング（簡易版）
      const clusters: AccentClusterAnalysis['clusters'] = [];
      const processedPrefectures = new Set<string>();
      
      prefectureDistributions.forEach((dist1, code1) => {
        if (processedPrefectures.has(code1) || dist1.size === 0) return;
        
        const pref1 = Prefecture.fromCode(code1);
        const cluster = {
          name: `${pref1.getRegion()}クラスター`,
          dominantAccentTypeId: 0,
          dominantAccentTypeName: '',
          prefectures: [] as Array<{ code: string; name: string; similarity: number }>,
        };

        // このクラスターの主要アクセントタイプを特定
        let maxCount = 0;
        dist1.forEach((count, typeId) => {
          if (count > maxCount) {
            maxCount = count;
            cluster.dominantAccentTypeId = typeId;
          }
        });

        // アクセントタイプ名を取得
        const dominantVote = votes.find(v => v.accentTypeId === cluster.dominantAccentTypeId);
        if (dominantVote) {
          cluster.dominantAccentTypeName = dominantVote.accentType.name;
        }

        // 類似する都道府県を追加
        prefectureDistributions.forEach((dist2, code2) => {
          if (!processedPrefectures.has(code2) && dist2.size > 0) {
            const similarity = this.calculateSimilarity(dist1, dist2);
            if (similarity > 0.7) { // 70%以上の類似度
              const pref2 = Prefecture.fromCode(code2);
              cluster.prefectures.push({
                code: code2,
                name: pref2.getName(),
                similarity,
              });
              processedPrefectures.add(code2);
            }
          }
        });

        if (cluster.prefectures.length > 0) {
          clusters.push(cluster);
        }
      });

      // 境界線の検出（隣接する都道府県間の差異）
      const boundaries: AccentClusterAnalysis['boundaries'] = [];
      const adjacentPairs = this.getAdjacentPrefectures();
      
      adjacentPairs.forEach(([code1, code2]) => {
        const dist1 = prefectureDistributions.get(code1);
        const dist2 = prefectureDistributions.get(code2);
        
        if (dist1 && dist2 && dist1.size > 0 && dist2.size > 0) {
          const difference = 1 - this.calculateSimilarity(dist1, dist2);
          if (difference > 0.5) { // 50%以上の差異
            boundaries.push({
              prefecture1: Prefecture.fromCode(code1).getName(),
              prefecture2: Prefecture.fromCode(code2).getName(),
              difference,
            });
          }
        }
      });

      return {
        wordId,
        clusters,
        boundaries: boundaries.sort((a, b) => b.difference - a.difference).slice(0, 10),
      };
    } catch (error) {
      logger.error('Error getting accent cluster analysis:', error);
      throw new AppError('クラスター分析の取得に失敗しました', 500, 'CLUSTER_ANALYSIS_ERROR');
    }
  }

  /**
   * 語の都道府県別トップ票獲得アクセント取得
   */
  async getTopVotesByPrefecture(wordId: number) {
    try {
      // 語の存在確認
      const word = await this.prisma.word.findUnique({
        where: { id: wordId },
        include: { category: true }
      });
      
      if (!word) {
        return null;
      }

      // 都道府県別の投票を集計
      const votes = await this.prisma.vote.findMany({
        where: { wordId },
        include: {
          accentType: true,
        }
      });

      // 都道府県ごとに集計
      const prefectureMap = new Map<string, {
        votes: Array<{ accentTypeId: number; accentTypeName: string }>;
      }>();

      // 全都道府県を初期化
      Prefecture.getAll().forEach(pref => {
        prefectureMap.set(pref.getCode(), {
          votes: [],
        });
      });

      // 投票データを集計
      votes.forEach(vote => {
        if (vote.prefectureCode && prefectureMap.has(vote.prefectureCode)) {
          prefectureMap.get(vote.prefectureCode)!.votes.push({
            accentTypeId: vote.accentTypeId,
            accentTypeName: vote.accentType.name,
          });
        }
      });

      // 都道府県別の最頻投票結果を作成
      const topVotesByPrefecture: Array<{
        prefecture: string;
        prefectureName: string;
        topAccentType: string | null;
        voteCount: number;
        percentage: number;
        totalVotes: number;
      }> = [];
      
      Prefecture.getAll().forEach(pref => {
        const prefData = prefectureMap.get(pref.getCode())!;
        const totalVotes = prefData.votes.length;
        
        if (totalVotes === 0) {
          // 投票データがない場合
          topVotesByPrefecture.push({
            prefecture: pref.getCode(),
            prefectureName: pref.getName(),
            topAccentType: null,
            voteCount: 0,
            percentage: 0,
            totalVotes: 0,
          });
        } else {
          // アクセントタイプ別に集計
          const accentCounts = new Map<string, number>();
          prefData.votes.forEach(vote => {
            const count = accentCounts.get(vote.accentTypeName) || 0;
            accentCounts.set(vote.accentTypeName, count + 1);
          });

          // 最多投票のアクセントタイプを特定
          let topAccentType = '';
          let maxCount = 0;
          
          accentCounts.forEach((count, typeName) => {
            if (count > maxCount) {
              maxCount = count;
              topAccentType = typeName;
            }
          });

          topVotesByPrefecture.push({
            prefecture: pref.getCode(),
            prefectureName: pref.getName(),
            topAccentType,
            voteCount: maxCount,
            percentage: (maxCount / totalVotes) * 100,
            totalVotes,
          });
        }
      });

      return {
        wordId: word.id,
        headword: word.headword,
        reading: word.reading,
        data: topVotesByPrefecture,
      };
    } catch (error) {
      logger.error('Error getting top votes by prefecture:', error);
      throw new AppError('都道府県別トップ票の取得に失敗しました', 500, 'TOP_VOTES_ERROR');
    }
  }

  /**
   * 地域別傾向を取得
   */
  async getRegionalTrends(region?: string) {
    try {
      let prefectureCodes: string[] = [];
      
      if (region) {
        // 指定地域の都道府県コードを取得
        prefectureCodes = Prefecture.getByRegion(region).map(p => p.getCode());
      } else {
        // 全都道府県コードを取得
        prefectureCodes = Prefecture.getAllCodes();
      }

      // 投票データを取得
      const votes = await this.prisma.vote.findMany({
        where: {
          prefectureCode: { in: prefectureCodes }
        },
        include: {
          accentType: true,
          word: {
            include: { category: true }
          },
          prefecture: true,
        }
      });

      // 地域・都道府県別に集計
      const regionStats = new Map<string, {
        totalVotes: number;
        accentDistribution: Map<number, { name: string; count: number }>;
        topWords: Map<number, { word: any; count: number }>;
      }>();

      votes.forEach(vote => {
        if (!vote.prefectureCode) return;
        
        try {
          const pref = Prefecture.fromCode(vote.prefectureCode);
          const regionName = pref.getRegion();
          
          if (!regionStats.has(regionName)) {
            regionStats.set(regionName, {
              totalVotes: 0,
              accentDistribution: new Map(),
              topWords: new Map(),
            });
          }
          
          const stats = regionStats.get(regionName)!;
          stats.totalVotes++;
          
          // アクセント分布
          if (!stats.accentDistribution.has(vote.accentTypeId)) {
            stats.accentDistribution.set(vote.accentTypeId, {
              name: vote.accentType.name,
              count: 0,
            });
          }
          stats.accentDistribution.get(vote.accentTypeId)!.count++;
          
          // 人気の語
          if (!stats.topWords.has(vote.wordId)) {
            stats.topWords.set(vote.wordId, {
              word: vote.word,
              count: 0,
            });
          }
          stats.topWords.get(vote.wordId)!.count++;
        } catch (e) {
          // 無効な都道府県コードは無視
        }
      });

      // 結果を整形
      const trends = Array.from(regionStats.entries()).map(([regionName, stats]) => {
        // アクセント分布を配列に変換
        const accentDistribution = Array.from(stats.accentDistribution.entries())
          .map(([id, data]) => ({
            accentTypeId: id,
            accentTypeName: data.name,
            voteCount: data.count,
            percentage: (data.count / stats.totalVotes) * 100,
          }))
          .sort((a, b) => b.voteCount - a.voteCount);

        // トップ語を配列に変換
        const topWords = Array.from(stats.topWords.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(item => ({
            wordId: item.word.id,
            headword: item.word.headword,
            reading: item.word.reading,
            category: item.word.category.name,
            voteCount: item.count,
          }));

        return {
          region: regionName,
          totalVotes: stats.totalVotes,
          accentDistribution,
          topWords,
        };
      });

      return trends;
    } catch (error) {
      logger.error('Error getting regional trends:', error);
      throw new AppError('地域別傾向の取得に失敗しました', 500, 'REGIONAL_TRENDS_ERROR');
    }
  }

  /**
   * 分布の類似度を計算（コサイン類似度）
   */
  private calculateSimilarity(dist1: Map<number, number>, dist2: Map<number, number>): number {
    const allKeys = new Set([...dist1.keys(), ...dist2.keys()]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allKeys.forEach(key => {
      const val1 = dist1.get(key) || 0;
      const val2 = dist2.get(key) || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 隣接する都道府県のペアを取得
   */
  private getAdjacentPrefectures(): Array<[string, string]> {
    // 主要な隣接関係を定義（簡易版）
    return [
      ['01', '02'], // 北海道-青森
      ['02', '03'], // 青森-岩手
      ['02', '05'], // 青森-秋田
      ['03', '04'], // 岩手-宮城
      ['04', '05'], // 宮城-秋田
      ['04', '06'], // 宮城-山形
      ['04', '07'], // 宮城-福島
      ['06', '07'], // 山形-福島
      ['07', '08'], // 福島-茨城
      ['07', '09'], // 福島-栃木
      ['07', '10'], // 福島-群馬
      ['08', '09'], // 茨城-栃木
      ['08', '11'], // 茨城-埼玉
      ['08', '12'], // 茨城-千葉
      ['09', '10'], // 栃木-群馬
      ['09', '11'], // 栃木-埼玉
      ['10', '11'], // 群馬-埼玉
      ['10', '15'], // 群馬-新潟
      ['10', '20'], // 群馬-長野
      ['11', '12'], // 埼玉-千葉
      ['11', '13'], // 埼玉-東京
      ['12', '13'], // 千葉-東京
      ['13', '14'], // 東京-神奈川
      ['13', '19'], // 東京-山梨
      ['14', '19'], // 神奈川-山梨
      ['14', '22'], // 神奈川-静岡
      ['15', '16'], // 新潟-富山
      ['15', '20'], // 新潟-長野
      ['16', '17'], // 富山-石川
      ['16', '21'], // 富山-岐阜
      ['17', '18'], // 石川-福井
      ['17', '21'], // 石川-岐阜
      ['18', '21'], // 福井-岐阜
      ['18', '25'], // 福井-滋賀
      ['18', '26'], // 福井-京都
      ['19', '20'], // 山梨-長野
      ['19', '22'], // 山梨-静岡
      ['20', '21'], // 長野-岐阜
      ['20', '22'], // 長野-静岡
      ['20', '23'], // 長野-愛知
      ['21', '23'], // 岐阜-愛知
      ['21', '24'], // 岐阜-三重
      ['21', '25'], // 岐阜-滋賀
      ['22', '23'], // 静岡-愛知
      ['23', '24'], // 愛知-三重
      ['24', '25'], // 三重-滋賀
      ['24', '26'], // 三重-京都
      ['24', '29'], // 三重-奈良
      ['24', '30'], // 三重-和歌山
      ['25', '26'], // 滋賀-京都
      ['26', '27'], // 京都-大阪
      ['26', '28'], // 京都-兵庫
      ['26', '29'], // 京都-奈良
      ['27', '28'], // 大阪-兵庫
      ['27', '29'], // 大阪-奈良
      ['27', '30'], // 大阪-和歌山
      ['28', '31'], // 兵庫-鳥取
      ['28', '33'], // 兵庫-岡山
      ['29', '30'], // 奈良-和歌山
      ['31', '32'], // 鳥取-島根
      ['31', '33'], // 鳥取-岡山
      ['32', '33'], // 島根-岡山
      ['32', '34'], // 島根-広島
      ['32', '35'], // 島根-山口
      ['33', '34'], // 岡山-広島
      ['34', '35'], // 広島-山口
      ['34', '38'], // 広島-愛媛
      ['35', '40'], // 山口-福岡
      ['35', '44'], // 山口-大分
      ['36', '37'], // 徳島-香川
      ['36', '38'], // 徳島-愛媛
      ['36', '39'], // 徳島-高知
      ['37', '38'], // 香川-愛媛
      ['38', '39'], // 愛媛-高知
      ['38', '44'], // 愛媛-大分
      ['40', '41'], // 福岡-佐賀
      ['40', '43'], // 福岡-熊本
      ['40', '44'], // 福岡-大分
      ['41', '42'], // 佐賀-長崎
      ['41', '43'], // 佐賀-熊本
      ['42', '43'], // 長崎-熊本
      ['43', '44'], // 熊本-大分
      ['43', '45'], // 熊本-宮崎
      ['43', '46'], // 熊本-鹿児島
      ['44', '45'], // 大分-宮崎
      ['45', '46'], // 宮崎-鹿児島
    ];
  }
}