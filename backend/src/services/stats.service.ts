/**
 * 統計サービス
 */

import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

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
}