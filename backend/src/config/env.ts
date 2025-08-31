/**
 * 環境変数設定とバリデーション
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// 環境変数スキーマ定義
const envSchema = z.object({
  // Node.js環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),
  
  // アプリケーション
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  // データベース
  DATABASE_URL: z.string().url().optional(),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  USE_MEMORY_DB: z.string().transform((val) => val === 'true').default('false'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_CACHE_DB: z.string().transform(Number).default('0'),
  REDIS_SESSION_DB: z.string().transform(Number).default('1'),
  REDIS_RATE_LIMIT_DB: z.string().transform(Number).default('2'),
  USE_MEMORY_CACHE: z.string().transform((val) => val === 'true').default('false'),
  
  // 認証
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400'),
  
  // Cookie暗号化
  COOKIE_SECRET_KEY: z.string().min(32).default('dev_cookie_secret_key_change_in_production_1234567890'),
  
  // セキュリティ
  CORS_ORIGINS: z.string().transform((val) => val.split(',')).default('http://localhost:3000'),
  
  // レート制限
  RATE_LIMIT_VOTE_PER_HOUR: z.string().transform(Number).default('60'),
  RATE_LIMIT_SUBMIT_PER_DAY: z.string().transform(Number).default('10'),
  RATE_LIMIT_API_PER_MINUTE: z.string().transform(Number).default('100'),
  
  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: z.string().optional(),
  
  // ログレベル
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // 機能フラグ
  FEATURE_USER_REGISTRATION: z.string().transform((val) => val === 'true').default('true'),
  FEATURE_WORD_SUBMISSION: z.string().transform((val) => val === 'true').default('true'),
  FEATURE_ADMIN_PANEL: z.string().transform((val) => val === 'true').default('true'),
  
  // 開発環境用フラグ
  DISABLE_AUTH: z.string().transform((val) => val === 'true').default('false'),
  DISABLE_RATE_LIMIT: z.string().transform((val) => val === 'true').default('false'),
  DISABLE_TURNSTILE: z.string().transform((val) => val === 'true').default('false'),
});

// 環境変数の型定義
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 環境変数設定クラス
 */
class EnvironmentConfig {
  private config: EnvConfig | null = null;
  
  /**
   * 環境変数をバリデーションして取得
   */
  validate(): EnvConfig {
    if (this.config) {
      return this.config;
    }
    
    // .envファイルの読み込み
    dotenv.config();
    
    try {
      // 環境変数のバリデーション
      const validated = envSchema.parse(process.env);
      this.config = validated;
      
      // 開発環境の場合、設定内容をログ出力（機密情報は除外）
      if (validated.NODE_ENV === 'development') {
        const safeConfig = {
          ...validated,
          DATABASE_URL: '***',
          JWT_SECRET: '***',
          SESSION_SECRET: '***',
          COOKIE_SECRET_KEY: '***',
          TURNSTILE_SECRET_KEY: '***',
        };
        logger.debug('Environment configuration loaded:', safeConfig);
      }
      
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => {
          return `- ${issue.path.join('.')}: ${issue.message}`;
        }).join('\\n');
        
        logger.error(`Environment validation failed:\\n${issues}`);
        throw new Error(`環境変数の検証に失敗しました。以下の項目を確認してください:\\n${issues}`);
      }
      throw error;
    }
  }
  
  /**
   * 環境変数を取得（バリデーション済みの場合のみ）
   */
  getEnv(): EnvConfig {
    if (!this.config) {
      throw new Error('環境変数が初期化されていません。先にvalidate()を呼び出してください。');
    }
    return this.config;
  }
  
  /**
   * 開発環境かどうか
   */
  isDevelopment(): boolean {
    return this.getEnv().NODE_ENV === 'development';
  }
  
  /**
   * 本番環境かどうか
   */
  isProduction(): boolean {
    return this.getEnv().NODE_ENV === 'production';
  }
  
  /**
   * テスト環境かどうか
   */
  isTest(): boolean {
    return this.getEnv().NODE_ENV === 'test';
  }
  
  /**
   * 機能が有効かどうか
   */
  isFeatureEnabled(feature: keyof Pick<EnvConfig, 'FEATURE_USER_REGISTRATION' | 'FEATURE_WORD_SUBMISSION' | 'FEATURE_ADMIN_PANEL'>): boolean {
    return this.getEnv()[feature] === true;
  }
}

// シングルトンインスタンス
export const config = new EnvironmentConfig();

// 環境変数の型をエクスポート
export type Environment = EnvConfig;