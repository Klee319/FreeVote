/**
 * サーバーエントリーポイント
 * 日本語アクセント投票サイト バックエンドAPI
 */

import dotenv from 'dotenv';
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { database } from './config/dev-database';
import { cacheManager } from './config/dev-cache';

// 環境変数の読み込み
dotenv.config();

/**
 * サーバー起動
 */
async function startServer() {
  try {
    // 環境変数のバリデーション
    const env = config.validate();
    
    // データベース接続
    if (env.USE_MEMORY_DB) {
      // メモリDBモードの場合
      await database.initialize();
      logger.info('Memory database initialized successfully');
    } else {
      // 通常のデータベース接続
      await connectDatabase();
      logger.info('Database connected successfully');
    }
    
    // Redis/キャッシュ接続
    if (env.USE_MEMORY_CACHE) {
      // メモリキャッシュモードの場合
      await cacheManager.initialize();
      logger.info('Memory cache initialized successfully');
    } else {
      // Redis接続
      await connectRedis();
      logger.info('Redis connected successfully');
    }
    
    // Expressアプリケーションの作成
    const app = createApp();
    
    // サーバー起動
    const port = env.PORT || 8000;
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API Base URL: http://localhost:${port}/api`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // データベース接続をクローズ
        if (env.USE_MEMORY_DB) {
          await database.disconnect();
          logger.info('Memory database disconnected');
        } else {
          await disconnectDatabase();
          logger.info('Database connection closed');
        }
        
        // Redis/キャッシュ接続をクローズ
        if (env.USE_MEMORY_CACHE) {
          await cacheManager.disconnect();
          logger.info('Memory cache disconnected');
        } else {
          await disconnectRedis();
          logger.info('Redis connection closed');
        }
        
        process.exit(0);
      });
      
      // 10秒後に強制終了
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // シグナルハンドリング
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // エラーハンドリング
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // アプリケーションを終了させる
      process.exit(1);
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // アプリケーションを終了させる
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}


// サーバー起動
startServer();