/**
 * 開発用データベース設定
 * Docker無しでも動作するようにSQLiteやメモリDBに対応
 */

import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

// メモリ内データストア（開発用簡易実装）
class InMemoryDatabase {
  private data: Map<string, Map<number, any>> = new Map();
  private idCounters: Map<string, number> = new Map();
  
  constructor() {
    this.initializeCollections();
  }
  
  private initializeCollections() {
    const collections = [
      'users', 'words', 'votes', 'wordCategories', 
      'accentTypes', 'prefectures', 'submissions'
    ];
    
    collections.forEach(collection => {
      this.data.set(collection, new Map());
      this.idCounters.set(collection, 1);
    });
    
    // 初期データの投入
    this.seedInitialData();
  }
  
  private seedInitialData() {
    // カテゴリの初期データ
    const categories = [
      { id: 1, name: '食べ物', slug: 'food' },
      { id: 2, name: '地名', slug: 'place' },
      { id: 3, name: '人名', slug: 'person' },
      { id: 4, name: '一般名詞', slug: 'general' },
      { id: 5, name: 'その他', slug: 'other' }
    ];
    
    categories.forEach(cat => {
      this.data.get('wordCategories')?.set(cat.id, cat);
    });
    this.idCounters.set('wordCategories', 6);
    
    // アクセント型の初期データ
    const accentTypes = [
      { id: 1, name: '平板型', pattern: '0' },
      { id: 2, name: '頭高型', pattern: '1' },
      { id: 3, name: '中高型', pattern: '2,3,4' },
      { id: 4, name: '尾高型', pattern: '-1' }
    ];
    
    accentTypes.forEach(type => {
      this.data.get('accentTypes')?.set(type.id, type);
    });
    this.idCounters.set('accentTypes', 5);
    
    // 都道府県の初期データ（一部のみ）
    const prefectures = [
      { id: 1, code: '01', name: '北海道', region: '北海道' },
      { id: 2, code: '13', name: '東京都', region: '関東' },
      { id: 3, code: '27', name: '大阪府', region: '近畿' },
      { id: 4, code: '40', name: '福岡県', region: '九州' }
    ];
    
    prefectures.forEach(pref => {
      this.data.get('prefectures')?.set(pref.id, pref);
    });
    this.idCounters.set('prefectures', 5);
    
    // サンプル語の初期データ
    const words = [
      { 
        id: 1, 
        headword: 'コーヒー', 
        reading: 'コーヒー',
        categoryId: 1,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        headword: '東京', 
        reading: 'トウキョウ',
        categoryId: 2,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    words.forEach(word => {
      this.data.get('words')?.set(word.id, word);
    });
    this.idCounters.set('words', 3);
  }
  
  // CRUD操作
  async create(collection: string, data: any) {
    const id = this.idCounters.get(collection) || 1;
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
    
    this.data.get(collection)?.set(id, record);
    this.idCounters.set(collection, id + 1);
    
    return record;
  }
  
  async findMany(collection: string, options?: any) {
    const records = Array.from(this.data.get(collection)?.values() || []);
    
    // whereフィルタリング
    let filtered = records;
    if (options?.where) {
      filtered = records.filter(record => {
        return Object.entries(options.where).every(([key, value]) => {
          if (value && typeof value === 'object' && 'in' in value) {
            return value.in.includes(record[key]);
          }
          return record[key] === value;
        });
      });
    }
    
    // orderBy
    if (options?.orderBy) {
      const orderBy = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      filtered.sort((a, b) => {
        for (const order of orderBy) {
          const [field, direction] = Object.entries(order)[0];
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // take/skip (pagination)
    if (options?.skip) {
      filtered = filtered.slice(options.skip);
    }
    if (options?.take) {
      filtered = filtered.slice(0, options.take);
    }
    
    return filtered;
  }
  
  async findUnique(collection: string, where: any) {
    if (where.id) {
      return this.data.get(collection)?.get(where.id) || null;
    }
    
    const records = Array.from(this.data.get(collection)?.values() || []);
    return records.find(record => {
      return Object.entries(where).every(([key, value]) => record[key] === value);
    }) || null;
  }
  
  async update(collection: string, where: any, data: any) {
    const record = await this.findUnique(collection, where);
    if (!record) return null;
    
    const updated = {
      ...record,
      ...data,
      updatedAt: new Date()
    };
    
    this.data.get(collection)?.set(record.id, updated);
    return updated;
  }
  
  async delete(collection: string, where: any) {
    const record = await this.findUnique(collection, where);
    if (!record) return null;
    
    this.data.get(collection)?.delete(record.id);
    return record;
  }
  
  async count(collection: string, options?: any) {
    const records = await this.findMany(collection, options);
    return records.length;
  }
  
  async groupBy(collection: string, options: any) {
    const records = await this.findMany(collection, { where: options.where });
    const groups = new Map<string, any[]>();
    
    records.forEach(record => {
      const key = options.by.map((field: string) => record[field]).join('-');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(record);
    });
    
    return Array.from(groups.entries()).map(([key, items]) => {
      const result: any = {};
      options.by.forEach((field: string, index: number) => {
        result[field] = items[0][field];
      });
      
      if (options._count) {
        result._count = { id: items.length };
      }
      
      return result;
    });
  }
}

// データベース接続管理
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma?: PrismaClient;
  private inMemoryDb?: InMemoryDatabase;
  private useInMemory: boolean = false;
  
  private constructor() {}
  
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  async initialize() {
    const databaseUrl = process.env.DATABASE_URL;
    
    // メモリDBを使用するかチェック
    if (!databaseUrl || databaseUrl === 'memory' || process.env.USE_MEMORY_DB === 'true') {
      logger.info('Using in-memory database for development');
      this.useInMemory = true;
      this.inMemoryDb = new InMemoryDatabase();
      return;
    }
    
    // SQLiteまたはPostgreSQLに接続
    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      
      // 接続テスト
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.warn('Failed to connect to database, falling back to in-memory database', error);
      this.useInMemory = true;
      this.inMemoryDb = new InMemoryDatabase();
    }
  }
  
  getClient() {
    if (this.useInMemory) {
      // PrismaClient風のインターフェースを返す
      return this.createPrismaLikeClient();
    }
    
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }
    
    return this.prisma;
  }
  
  private createPrismaLikeClient() {
    const db = this.inMemoryDb!;
    
    return {
      user: {
        create: (args: any) => db.create('users', args.data),
        findMany: (args?: any) => db.findMany('users', args),
        findUnique: (args: any) => db.findUnique('users', args.where),
        update: (args: any) => db.update('users', args.where, args.data),
        delete: (args: any) => db.delete('users', args.where),
        count: (args?: any) => db.count('users', args),
      },
      word: {
        create: (args: any) => db.create('words', args.data),
        findMany: (args?: any) => db.findMany('words', args),
        findUnique: (args: any) => db.findUnique('words', args.where),
        update: (args: any) => db.update('words', args.where, args.data),
        delete: (args: any) => db.delete('words', args.where),
        count: (args?: any) => db.count('words', args),
        groupBy: (args: any) => db.groupBy('words', args),
      },
      vote: {
        create: (args: any) => db.create('votes', args.data),
        findMany: (args?: any) => db.findMany('votes', args),
        findUnique: (args: any) => db.findUnique('votes', args.where),
        update: (args: any) => db.update('votes', args.where, args.data),
        delete: (args: any) => db.delete('votes', args.where),
        count: (args?: any) => db.count('votes', args),
        groupBy: (args: any) => db.groupBy('votes', args),
      },
      wordCategory: {
        findMany: (args?: any) => db.findMany('wordCategories', args),
        findUnique: (args: any) => db.findUnique('wordCategories', args.where),
      },
      accentType: {
        findMany: (args?: any) => db.findMany('accentTypes', args),
        findUnique: (args: any) => db.findUnique('accentTypes', args.where),
      },
      prefecture: {
        findMany: (args?: any) => db.findMany('prefectures', args),
        findUnique: (args: any) => db.findUnique('prefectures', args.where),
      },
      submission: {
        create: (args: any) => db.create('submissions', args.data),
        findMany: (args?: any) => db.findMany('submissions', args),
        count: (args?: any) => db.count('submissions', args),
      },
      wordPrefStats: {
        findMany: (args?: any) => db.findMany('wordPrefStats', args),
      },
      wordNationalStats: {
        findMany: (args?: any) => db.findMany('wordNationalStats', args),
      },
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      $queryRaw: () => Promise.resolve([]),
    };
  }
  
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}

// エクスポート
export const database = DatabaseConnection.getInstance();