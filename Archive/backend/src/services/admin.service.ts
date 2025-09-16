/**
 * 管理機能サービス
 */

import { PrismaClient } from '../generated/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export interface DatabaseResetResult {
  success: boolean;
  deletedRecords: Record<string, number>;
  totalDeleted: number;
  timestamp: Date;
}

export interface TableInfo {
  name: string;
  count: number;
}

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  /**
   * データベースリセット
   * 全テーブルのデータを削除（開発環境のみ）
   */
  async resetDatabase(): Promise<DatabaseResetResult> {
    // 本番環境での実行を防止
    const env = config.getEnv();
    if (env.NODE_ENV === 'production') {
      throw new AppError('本番環境でのデータベースリセットは許可されていません', 403);
    }

    logger.warn('データベースリセットを開始します');

    const deletedRecords: Record<string, number> = {};
    let totalDeleted = 0;

    try {
      // トランザクションで全削除を実行
      await this.prisma.$transaction(async (tx) => {
        // 外部キー制約を一時的に無効化（SQLite）
        await tx.$executeRawUnsafe('PRAGMA foreign_keys = OFF');

        // 削除順序（依存関係を考慮）
        const deleteOrder = [
          'audit_logs',
          'rate_limits', 
          'word_national_stats',
          'word_pref_stats',
          'votes',
          'accent_options',
          'word_aliases',
          'submissions',
          'anonymous_users',
          'words',
          'users',
          'devices',
          'accent_types',
          'word_categories',
          'prefectures'
        ];

        for (const tableName of deleteOrder) {
          try {
            // テーブルの存在確認
            const tableExists = await tx.$queryRawUnsafe(
              `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
              tableName
            );

            if (tableExists && (tableExists as any[]).length > 0) {
              // レコード数を取得
              const countResult = await tx.$queryRawUnsafe(
                `SELECT COUNT(*) as count FROM "${tableName}"`
              ) as any[];
              const beforeCount = countResult[0]?.count || 0;

              // データ削除
              const deleteResult = await tx.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
              
              // SQLiteの自動インクリメントをリセット
              await tx.$executeRawUnsafe(
                `DELETE FROM sqlite_sequence WHERE name=?`,
                tableName
              );

              deletedRecords[tableName] = Number(beforeCount);
              totalDeleted += Number(beforeCount);

              logger.info(`テーブル ${tableName}: ${beforeCount} レコードを削除`);
            }
          } catch (error) {
            logger.error(`テーブル ${tableName} の削除に失敗:`, error);
            throw new AppError(`テーブル ${tableName} の削除に失敗しました`, 500);
          }
        }

        // 外部キー制約を再度有効化
        await tx.$executeRawUnsafe('PRAGMA foreign_keys = ON');
      });

      // データベース最適化（SQLite VACUUM）
      await this.prisma.$executeRawUnsafe('VACUUM');

      logger.info(`データベースリセット完了: ${totalDeleted} レコードを削除`);

      return {
        success: true,
        deletedRecords,
        totalDeleted,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('データベースリセットに失敗:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('データベースリセットに失敗しました', 500);
    }
  }

  /**
   * データベース統計情報の取得
   */
  async getDatabaseStats(): Promise<{
    tables: TableInfo[];
    totalRecords: number;
    databaseSize: string;
  }> {
    try {
      // テーブル一覧を取得
      const tables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_prisma_%'
        ORDER BY name
      ` as any[];

      const tableInfo: TableInfo[] = [];
      let totalRecords = 0;

      // 各テーブルのレコード数を取得
      for (const table of tables) {
        const countResult = await this.prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${table.name}"`
        ) as any[];
        
        const count = countResult[0]?.count || 0;
        tableInfo.push({
          name: table.name,
          count: Number(count),
        });
        totalRecords += Number(count);
      }

      // データベースサイズを取得（SQLite page_count * page_size）
      const sizeResult = await this.prisma.$queryRaw`
        SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()
      ` as any[];
      
      const sizeInBytes = sizeResult[0]?.size || 0;
      const databaseSize = this.formatBytes(Number(sizeInBytes));

      return {
        tables: tableInfo,
        totalRecords,
        databaseSize,
      };
    } catch (error) {
      logger.error('データベース統計情報の取得に失敗:', error);
      throw new AppError('データベース統計情報の取得に失敗しました', 500);
    }
  }

  /**
   * バイト数を人間が読みやすい形式に変換
   */
  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * 監査ログの記録
   */
  async createAuditLog(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId?: number,
    oldData?: any,
    newData?: any,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    }
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          deviceId: metadata?.deviceId || null,
          action,
          resourceType,
          resourceId: resourceId || null,
          oldData: oldData ? JSON.stringify(oldData) : null,
          newData: newData ? JSON.stringify(newData) : null,
          ipAddress: metadata?.ipAddress || null,
          userAgent: metadata?.userAgent || null,
        },
      });
    } catch (error) {
      logger.error('監査ログの記録に失敗:', error);
      // 監査ログの失敗は本処理をブロックしない
    }
  }
}

// デフォルトエクスポート
export default AdminService;