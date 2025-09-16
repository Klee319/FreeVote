import { PrismaClient } from '../generated/prisma';
import { database } from '../config/dev-database';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  var dbInitialized: boolean | undefined;
}

/**
 * Prismaクライアントの初期化とシングルトンインスタンス
 * 開発環境ではホットリロード時に複数のインスタンスが作成されるのを防ぐ
 */
let prismaInstance: PrismaClient | any;

// メモリDBモード判定
const useMemoryDb = process.env.USE_MEMORY_DB === 'true' || 
                    process.env.DATABASE_URL === 'memory' ||
                    !process.env.DATABASE_URL;

if (useMemoryDb) {
  // メモリDBを使用
  if (!global.dbInitialized) {
    database.initialize().then(() => {
      logger.info('Database initialized (memory mode)');
      global.dbInitialized = true;
    }).catch(err => {
      logger.error('Failed to initialize database:', err);
    });
  }
  prismaInstance = database.getClient();
} else {
  // 通常のPrismaClientを使用
  prismaInstance = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
  
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;

/**
 * アプリケーション終了時の接続クリーンアップ
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}