/**
 * 語関連コントローラー
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';
import { WordService } from '../services/word.service';
import { StatsService } from '../services/stats.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { validationResult } from 'express-validator';

export class WordsController {
  private wordService: WordService;
  private statsService: StatsService;
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.wordService = new WordService(this.prisma);
    this.statsService = new StatsService();
  }
  
  /**
   * 語の検索・一覧取得
   * GET /api/words
   */
  async searchWords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // バリデーションエラーチェック
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('バリデーションエラー', 400, 'VALIDATION_ERROR', errors.array());
      }
      
      const {
        q,
        category,
        page = 1,
        limit = 20,
        sort = 'popular'
      } = req.query;
      
      const result = await this.wordService.searchWords({
        query: q as string,
        category: category as string,
        page: Number(page),
        limit: Math.min(Number(limit), 100),
        sort: sort as 'latest' | 'popular' | 'alphabetic'
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 語の詳細取得
   * GET /api/words/:id
   */
  async getWordDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const wordId = Number(id);
      
      if (isNaN(wordId) || wordId <= 0) {
        throw new AppError('不正な語IDです', 400, 'INVALID_WORD_ID');
      }
      
      // デバイスID取得（投票可否判定用）
      const deviceId = req.headers['x-device-id'] as string;
      
      const word = await this.wordService.getWordDetail(wordId, deviceId);
      
      if (!word) {
        throw new AppError('指定された語が見つかりません', 404, 'WORD_NOT_FOUND');
      }
      
      res.json({
        success: true,
        data: word
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 都道府県別統計取得
   * GET /api/words/:id/stats
   */
  async getWordStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { prefecture } = req.query;
      const wordId = Number(id);
      
      if (isNaN(wordId) || wordId <= 0) {
        throw new AppError('不正な語IDです', 400, 'INVALID_WORD_ID');
      }
      
      const stats = await this.statsService.getWordPrefectureStats(
        wordId,
        prefecture as string
      );
      
      if (!stats) {
        throw new AppError('統計データが見つかりません', 404, 'STATS_NOT_FOUND');
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 新着語一覧取得
   * GET /api/words/recent
   */
  async getRecentWords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20
      } = req.query;
      
      const result = await this.wordService.getRecentWords({
        page: Number(page),
        limit: Math.min(Number(limit), 50)
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 新語投稿（認証必須）
   * POST /api/words
   */
  async submitWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // バリデーションエラーチェック
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('バリデーションエラー', 400, 'VALIDATION_ERROR', errors.array());
      }
      
      // ユーザー認証確認
      const userId = (req as any).userId;
      if (!userId) {
        throw new AppError('認証が必要です', 401, 'AUTHENTICATION_REQUIRED');
      }
      
      const {
        headword,
        reading,
        categoryId,
        aliases,
        initialAccentType,
        prefecture,
        ageGroup,
        turnstileToken
      } = req.body;
      
      // Turnstile検証（本番環境のみ）
      if (process.env.NODE_ENV === 'production') {
        const isValidToken = await this.validateTurnstileToken(turnstileToken);
        if (!isValidToken) {
          throw new AppError('ボット検証に失敗しました', 400, 'TURNSTILE_VERIFICATION_FAILED');
        }
      }
      
      // 読みのバリデーション（カタカナのみ）
      if (!/^[ァ-ヶー]+$/.test(reading)) {
        throw new AppError('読みはカタカナで入力してください', 400, 'INVALID_READING');
      }
      
      const result = await this.wordService.submitWord({
        headword,
        reading,
        categoryId,
        aliases,
        initialAccentType,
        prefecture,
        ageGroup,
        submittedBy: userId
      });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Turnstileトークン検証
   */
  private async validateTurnstileToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || '',
          response: token,
        }),
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      logger.error('Turnstile verification error:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const wordsController = new WordsController();