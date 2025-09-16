/**
 * 開発用キャッシュ設定
 * Redis接続失敗時はメモリキャッシュにフォールバック
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

/**
 * メモリキャッシュクラス（開発用）
 */
class MemoryCache {
  private cache: Map<string, { value: any; expiry?: number }> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 有効期限チェック
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return JSON.stringify(item.value);
  }
  
  async set(key: string, value: string | any, options?: { EX?: number }): Promise<void> {
    // 既存のタイマーをクリア
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }
    
    const data = typeof value === 'string' ? JSON.parse(value) : value;
    const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    
    this.cache.set(key, { value: data, expiry });
    
    // 自動削除タイマーを設定
    if (options?.EX) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, options.EX * 1000);
      
      this.timers.set(key, timer);
    }
  }
  
  async setEx(key: string, seconds: number, value: string | any): Promise<void> {
    // setExメソッドをRedis互換で実装
    await this.set(key, value, { EX: seconds });
  }
  
  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    
    keys.forEach(k => {
      this.cache.delete(k);
      
      // タイマーもクリア
      const timer = this.timers.get(k);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(k);
      }
    });
  }
  
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // 有効期限チェック
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(JSON.parse(current)) : 0;
    const newValue = value + 1;
    
    await this.set(key, newValue);
    return newValue;
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    const item = this.cache.get(key);
    
    if (item) {
      // 既存のタイマーをクリア
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // 新しい有効期限を設定
      item.expiry = Date.now() + (seconds * 1000);
      
      // 新しいタイマーを設定
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, seconds * 1000);
      
      this.timers.set(key, timer);
    }
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const allKeys = Array.from(this.cache.keys());
    
    return allKeys.filter(key => regex.test(key));
  }
  
  async flushAll(): Promise<void> {
    // すべてのタイマーをクリア
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // キャッシュをクリア
    this.cache.clear();
  }
  
  // Redis互換メソッド
  async connect(): Promise<void> {
    logger.info('Memory cache initialized');
  }
  
  async disconnect(): Promise<void> {
    await this.flushAll();
    logger.info('Memory cache cleared');
  }
  
  on(event: string, callback: Function): void {
    // イベントハンドラのダミー実装
    if (event === 'error') {
      // エラーハンドリング
    }
  }
}

/**
 * キャッシュマネージャー
 */
export class CacheManager {
  private static instance: CacheManager;
  private client: RedisClientType | MemoryCache | null = null;
  private useMemoryCache: boolean = false;
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  async initialize(): Promise<void> {
    const useMemory = process.env.USE_MEMORY_CACHE === 'true' || process.env.NODE_ENV === 'test';
    const redisUrl = process.env.REDIS_URL;
    
    if (useMemory || !redisUrl) {
      logger.info('Using memory cache');
      this.useMemoryCache = true;
      this.client = new MemoryCache();
      await this.client.connect();
      return;
    }
    
    try {
      // Redisに接続を試みる
      const redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.error('Redis connection failed after 3 retries, switching to memory cache');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      redisClient.on('error', (err) => {
        logger.error('Redis client error:', err);
      });
      
      await redisClient.connect();
      
      // 接続テスト
      await redisClient.ping();
      
      this.client = redisClient as RedisClientType;
      logger.info('Redis cache connected successfully');
    } catch (error) {
      logger.warn('Failed to connect to Redis, falling back to memory cache', error);
      this.useMemoryCache = true;
      this.client = new MemoryCache();
      await this.client.connect();
    }
  }
  
  getClient(): RedisClientType | MemoryCache {
    if (!this.client) {
      throw new Error('Cache not initialized');
    }
    return this.client;
  }
  
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) {
      return;
    }
    
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.client.set(key, data, { EX: ttl });
      } else {
        await this.client.set(key, data);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }
  
  async del(key: string | string[]): Promise<void> {
    if (!this.client) {
      return;
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }
  
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      if (this.useMemoryCache) {
        return await (this.client as MemoryCache).exists(key);
      } else {
        const result = await (this.client as RedisClientType).exists(key);
        return result > 0;
      }
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }
  
  async incr(key: string): Promise<number> {
    if (!this.client) {
      return 0;
    }
    
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Cache incr error:', error);
      return 0;
    }
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) {
      return;
    }
    
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Cache expire error:', error);
    }
  }
  
  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }
  
  async flushAll(): Promise<void> {
    if (!this.client) {
      return;
    }
    
    try {
      if (this.useMemoryCache) {
        await (this.client as MemoryCache).flushAll();
      } else {
        await (this.client as RedisClientType).flushAll();
      }
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
  }
  
  isMemoryCache(): boolean {
    return this.useMemoryCache;
  }
}

// シングルトンインスタンスをエクスポート
export const cacheManager = CacheManager.getInstance();