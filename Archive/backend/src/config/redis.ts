/**
 * Redis接続設定
 */

import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';
import { cacheManager } from './dev-cache';

let redis: Redis | null = null;
let cacheRedis: Redis | null = null;
let sessionRedis: Redis | null = null;
let rateLimitRedis: Redis | null = null;

/**
 * Redisクライアント作成
 */
function createRedisClient(db: number, name: string): Redis {
  const env = config.getEnv();
  
  const client = new Redis(env.REDIS_URL, {
    db,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Redis が読み取り専用モードの場合、再接続
        return true;
      }
      return false;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  
  // イベントハンドラー
  client.on('connect', () => {
    logger.info(`Redis client '${name}' connected`);
  });
  
  client.on('ready', () => {
    logger.info(`Redis client '${name}' ready`);
  });
  
  client.on('error', (err) => {
    logger.error(`Redis client '${name}' error:`, err);
  });
  
  client.on('close', () => {
    logger.warn(`Redis client '${name}' connection closed`);
  });
  
  client.on('reconnecting', () => {
    logger.info(`Redis client '${name}' reconnecting...`);
  });
  
  return client;
}

/**
 * Redis接続
 */
export async function connectRedis(): Promise<void> {
  // メモリキャッシュモードチェック
  if (process.env.USE_MEMORY_CACHE === 'true') {
    logger.info('Using memory cache instead of Redis');
    await cacheManager.initialize();
    return;
  }
  
  try {
    const env = config.getEnv();
    
    // キャッシュ用Redis
    cacheRedis = createRedisClient(env.REDIS_CACHE_DB, 'cache');
    await cacheRedis.ping();
    
    // セッション用Redis
    sessionRedis = createRedisClient(env.REDIS_SESSION_DB, 'session');
    await sessionRedis.ping();
    
    // レート制限用Redis
    rateLimitRedis = createRedisClient(env.REDIS_RATE_LIMIT_DB, 'rate-limit');
    await rateLimitRedis.ping();
    
    // デフォルトRedis（キャッシュ用）
    redis = cacheRedis;
    
    logger.info('All Redis connections established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis, falling back to memory cache:', error);
    
    // Redisに接続できない場合はメモリキャッシュにフォールバック
    await cacheManager.initialize();
  }
}

/**
 * Redis切断
 */
export async function disconnectRedis(): Promise<void> {
  const clients = [
    { client: cacheRedis, name: 'cache' },
    { client: sessionRedis, name: 'session' },
    { client: rateLimitRedis, name: 'rate-limit' },
  ];
  
  for (const { client, name } of clients) {
    if (client) {
      await client.quit();
      logger.info(`Redis client '${name}' disconnected`);
    }
  }
  
  cacheRedis = null;
  sessionRedis = null;
  rateLimitRedis = null;
  redis = null;
}

/**
 * キャッシュ用Redisクライアント取得
 */
export function getCacheRedis(): Redis | any {
  // メモリキャッシュモードの場合
  if (process.env.USE_MEMORY_CACHE === 'true' || cacheManager.isMemoryCache()) {
    return cacheManager.getClient();
  }
  
  if (!cacheRedis) {
    // フォールバックとしてメモリキャッシュを返す
    logger.warn('Cache Redis client not initialized, using memory cache');
    return cacheManager.getClient();
  }
  return cacheRedis;
}

/**
 * セッション用Redisクライアント取得
 */
export function getSessionRedis(): Redis | any {
  // メモリキャッシュモードの場合
  if (process.env.USE_MEMORY_CACHE === 'true' || cacheManager.isMemoryCache()) {
    return cacheManager.getClient();
  }
  
  if (!sessionRedis) {
    // フォールバックとしてメモリキャッシュを返す
    logger.warn('Session Redis client not initialized, using memory cache');
    return cacheManager.getClient();
  }
  return sessionRedis;
}

/**
 * レート制限用Redisクライアント取得
 */
export function getRateLimitRedis(): Redis | any {
  // メモリキャッシュモードの場合
  if (process.env.USE_MEMORY_CACHE === 'true' || cacheManager.isMemoryCache()) {
    return cacheManager.getClient();
  }
  
  if (!rateLimitRedis) {
    // フォールバックとしてメモリキャッシュを返す
    logger.warn('Rate limit Redis client not initialized, using memory cache');
    return cacheManager.getClient();
  }
  return rateLimitRedis;
}

/**
 * キャッシュヘルパー関数
 */
export class CacheHelper {
  private static redis = getCacheRedis;
  
  /**
   * キャッシュ取得
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis().get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * キャッシュ設定
   */
  static async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await this.redis().setEx(key, ttl, data);
      } else {
        await this.redis().set(key, data);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }
  
  /**
   * キャッシュ削除
   */
  static async delete(key: string): Promise<void> {
    try {
      await this.redis().del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }
  
  /**
   * パターンマッチでキャッシュ削除
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const redis = this.redis();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }
  
  /**
   * キャッシュ存在確認
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis().exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * TTL取得
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await this.redis().ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }
}

// エクスポート
export { redis };
export type { Redis };