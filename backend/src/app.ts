/**
 * Express アプリケーション設定
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import routes from './routes';

/**
 * Expressアプリケーションを作成・設定
 */
export function createApp(): Application {
  const app = express();
  const env = config.getEnv();
  
  // セキュリティミドルウェア
  app.use(helmet());
  
  // CORS設定
  app.use(cors({
    origin: env.CORS_ORIGINS || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  // ボディパーサー
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // リクエストロギング
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));
  }
  
  // グローバルレート制限
  const globalRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分
    max: env.RATE_LIMIT_API_PER_MINUTE || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'APIリクエスト制限を超過しました。しばらく待ってから再試行してください。'
        }
      });
    }
  });
  
  app.use('/api', globalRateLimiter);
  
  // ヘルスチェック
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV
    });
  });
  
  // APIバージョン情報
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'Japanese Accent Voting Site API',
      version: '1.0.0',
      description: '日本語アクセント投票サイトのバックエンドAPI',
      documentation: '/api/docs',
      endpoints: {
        words: '/api/words',
        votes: '/api/votes',
        ranking: '/api/ranking',
        auth: '/api/auth',
        stats: '/api/stats'
      }
    });
  });
  
  // APIルート
  app.use('/api', routes);
  
  // 404ハンドラー
  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'リクエストされたエンドポイントが見つかりません。',
        path: req.path
      }
    });
  });
  
  // エラーハンドラー（必ず最後に配置）
  app.use(errorHandler);
  
  return app;
}