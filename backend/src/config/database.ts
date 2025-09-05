/**
 * データベース接続設定
 */

import { PrismaClient } from '../generated/prisma';
import { config } from './env';
import { logger } from '../utils/logger';

let prisma: PrismaClient | null = null;

/**
 * Prismaクライアントの取得
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const env = config.getEnv();
    
    prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });
    
    // クエリのロギング（開発環境のみ）
    if (env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: any) => {
        logger.debug('Query:', e.query);
        logger.debug('Params:', e.params);
        logger.debug('Duration:', e.duration + 'ms');
      });
    }
  }
  
  return prisma;
}

/**
 * データベース接続
 */
export async function connectDatabase(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    
    // 接続確認クエリ
    await client.$queryRaw`SELECT 1`;
    
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw new Error('データベース接続に失敗しました');
  }
}

/**
 * データベース切断
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Database connection closed');
  }
}

/**
 * トランザクション実行ヘルパー
 */
export async function transaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getPrismaClient();
  return await client.$transaction(async (tx) => {
    return await fn(tx as PrismaClient);
  });
}

// 型エクスポート
export { PrismaClient };
export type { Prisma } from '../generated/prisma';

// デフォルトエクスポート（互換性のため）
export default getPrismaClient();