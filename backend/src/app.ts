import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import pollsRoutes from './routes/polls.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();

// セキュリティミドルウェア
app.use(helmet());

// CORS設定
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// ボディパーサー
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// レート制限
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'リクエスト回数の上限に達しました。しばらく待ってから再度お試しください。',
  standardHeaders: true,
  legacyHeaders: false,
});

// API全体にレート制限を適用
app.use('/api', limiter);

// ヘルスチェックエンドポイント
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/admin', adminRoutes);

// 404ハンドラー
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'エンドポイントが見つかりません',
      code: 'NOT_FOUND',
    },
  });
});

// エラーハンドラー（最後に配置）
app.use(errorHandler);

export default app;