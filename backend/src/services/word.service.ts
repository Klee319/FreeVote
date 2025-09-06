/**
 * 語関連サービス
 */

import { PrismaClient } from '../generated/prisma';
import { WordRepository } from '../repositories/word.repository';
import { VoteRepository } from '../repositories/vote.repository';
import { CacheHelper } from '../config/redis';
import { MoraAnalyzer } from '../domain/services/mora-analyzer';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

interface SearchWordsParams {
  query?: string;
  category?: string;
  page: number;
  limit: number;
  sort: 'latest' | 'popular' | 'alphabetic';
}

interface SearchWordsResult {
  words: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface WordDetail {
  word: any;
  accentOptions: any[];
  aliases: string[];
  nationalStats: any[];
  canVote: boolean;
  userVote?: any;
}

export class WordService {
  private wordRepository: WordRepository;
  private voteRepository: VoteRepository;
  
  constructor(private prisma?: PrismaClient) {
    // PrismaClientが渡されなかった場合は新しいインスタンスを作成
    const prismaInstance = this.prisma || new PrismaClient();
    this.wordRepository = new WordRepository(prismaInstance);
    this.voteRepository = new VoteRepository(prismaInstance);
  }
  
  /**
   * 語を検索
   */
  async searchWords(params: SearchWordsParams): Promise<SearchWordsResult> {
    const { query, category, page, limit, sort } = params;
    
    // キャッシュキー生成
    const cacheKey = `words:search:${JSON.stringify(params)}`;
    
    // キャッシュ確認
    const cached = await CacheHelper.get<SearchWordsResult>(cacheKey);
    if (cached) {
      logger.debug('Cache hit for word search');
      return cached;
    }
    
    // データベースから検索
    const result = await this.wordRepository.searchWords({
      query,
      category,
      page,
      limit,
      sort,
      status: 'approved' // 承認済みのみ
    });
    
    // レスポンス形式に変換
    const response: SearchWordsResult = {
      words: result.words.map(word => ({
        id: word.id,
        headword: word.headword,
        reading: word.reading,
        category: word.category?.name || '',
        totalVotes: word._count?.votes || 0,
        prefectureCount: word.prefectureCount || 0,
        lastVoteAt: word.lastVoteAt?.toISOString(),
        createdAt: word.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
    
    // キャッシュ保存（5分）
    await CacheHelper.set(cacheKey, response, 300);
    
    return response;
  }
  
  /**
   * 語の詳細を取得
   */
  async getWordDetail(wordId: number, deviceId?: string): Promise<WordDetail | null> {
    // データベースから直接取得（キャッシュを使わない）
    const word = await this.wordRepository.getWordById(wordId);
    
    if (!word || word.status !== 'approved') {
      return null;
    }
    
    // アクセントオプション取得
    const accentOptions = await this.wordRepository.getAccentOptions(wordId);
    
    // 全国統計取得（キャッシュを使わない）
    const nationalStats = await this.wordRepository.getNationalStats(wordId);
    
    // 総投票数を再計算
    const totalVotes = await this.wordRepository.getTotalVotes(wordId);
    
    // 投票可否判定
    let canVote = true;
    let userVote = null;
    
    if (deviceId) {
      // 24時間以内の投票確認
      userVote = await this.voteRepository.getRecentVote(wordId, deviceId);
      canVote = !userVote;
    }
    
    return {
      word: {
        id: word.id,
        headword: word.headword,
        reading: word.reading,
        category: word.category?.name || '',
        moraCount: word.moraCount,
        moraSegments: typeof word.moraSegments === 'string' 
          ? word.moraSegments.split('|') 
          : word.moraSegments || [],
        totalVotes: totalVotes || word._count?.votes || 0, // 最新の総投票数を使用
        prefectureCount: word.prefectureCount || 0,
        createdAt: word.createdAt.toISOString()
      },
      accentOptions: accentOptions.map(option => ({
        id: option.id,
        accentTypeId: option.accentTypeId,
        accentType: {
          code: option.accentType.code,
          name: option.accentType.name
        },
        pattern: option.accentPattern,
        dropPosition: option.dropPosition
      })),
      aliases: word.aliases?.map((a: any) => a.alias) || [],
      nationalStats: nationalStats.map(stat => ({
        accentType: stat.accentType.code, // フロントエンドは文字列を期待
        voteCount: stat.voteCount,
        percentage: stat.votePercentage
      })),
      canVote,
      userVote: userVote ? {
        accentType: userVote.accentType?.code,
        prefecture: userVote.prefecture?.name,
        ageGroup: userVote.ageGroup,
        votedAt: userVote.createdAt.toISOString()
      } : undefined
    };
  }
  
  /**
   * 語のキャッシュをクリア
   */
  async clearWordCache(wordId: number): Promise<void> {
    const cacheKey = `word:detail:${wordId}`;
    await CacheHelper.delete(cacheKey);
    logger.debug(`Cleared cache for word ${wordId}`);
  }
  
  /**
   * 新着語一覧を取得
   */
  async getRecentWords(params: { page: number; limit: number }) {
    const { page, limit } = params;
    
    // キャッシュキー生成
    const cacheKey = `words:recent:${page}:${limit}`;
    
    // キャッシュ確認
    const cached = await CacheHelper.get<any>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // データベースから取得
    const result = await this.wordRepository.getRecentWords({
      page,
      limit,
      status: 'approved'
    });
    
    const response = {
      words: result.words.map(word => ({
        id: word.id,
        headword: word.headword,
        reading: word.reading,
        category: word.category?.name || '',
        submittedBy: word.submittedBy ? `User${word.submittedBy.substring(0, 8)}` : null,
        approvedAt: word.approvedAt?.toISOString(),
        initialVotes: word._count?.votes || 0
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
    
    // キャッシュ保存（10分）
    await CacheHelper.set(cacheKey, response, 600);
    
    return response;
  }
  
  /**
   * 新語を投稿
   */
  async submitWord(params: {
    headword: string;
    reading: string;
    categoryId: number;
    aliases?: string[];
    initialAccentType: string;
    prefecture: string;
    ageGroup?: string;
    submittedBy: string;
  }) {
    const {
      headword,
      reading,
      categoryId,
      aliases,
      initialAccentType,
      prefecture,
      ageGroup,
      submittedBy
    } = params;
    
    // 重複チェック
    const existing = await this.wordRepository.findByHeadwordAndReading(headword, reading);
    if (existing) {
      throw new AppError('同じ語が既に存在します', 400, 'WORD_ALREADY_EXISTS');
    }
    
    // モーラ分析
    const moraSegments = MoraAnalyzer.splitIntoMora(reading);
    const moraCount = moraSegments.length;
    
    // 投稿データ作成
    const submission = await this.wordRepository.createSubmission({
      headword,
      reading,
      categoryId,
      aliases: aliases?.join(','),
      submittedBy,
      initialAccentTypeCode: initialAccentType,
      prefecture,
      ageGroup,
      moraCount,
      moraSegments
    });
    
    // 類似語検索
    const similarWords = await this.wordRepository.findSimilarWords(headword, reading);
    
    return {
      submissionId: submission.id,
      status: 'pending' as const,
      estimatedReviewTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      similarWords: similarWords.map(word => ({
        id: word.id,
        headword: word.headword,
        reading: word.reading,
        category: word.category?.name || '',
        totalVotes: word._count?.votes || 0,
        prefectureCount: word.prefectureCount || 0,
        lastVoteAt: word.lastVoteAt?.toISOString(),
        createdAt: word.createdAt.toISOString()
      }))
    };
  }
}