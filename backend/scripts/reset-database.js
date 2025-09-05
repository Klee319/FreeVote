#!/usr/bin/env node

/**
 * データベースリセットスクリプト
 * 
 * このスクリプトは全てのデータベーステーブルのデータをクリアします。
 * 開発環境でのみ実行可能です。
 * 
 * 使用方法:
 *   npm run db:reset
 *   または
 *   node scripts/reset-database.js --force (確認スキップ)
 */

const { PrismaClient } = require('../src/generated/prisma');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// 環境変数の読み込み
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env')
});

// カラー出力用のユーティリティ
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`)
};

// Prismaクライアントの初期化
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// コマンドライン引数のパース
const args = process.argv.slice(2);
const forceFlag = args.includes('--force') || args.includes('-f');
const helpFlag = args.includes('--help') || args.includes('-h');

/**
 * ヘルプメッセージの表示
 */
function showHelp() {
  console.log(`
データベースリセットスクリプト

使用方法:
  node scripts/reset-database.js [オプション]

オプション:
  --force, -f    確認プロンプトをスキップ
  --help, -h     このヘルプメッセージを表示

環境変数:
  NODE_ENV       実行環境（production時は実行不可）
  DATABASE_URL   データベース接続URL

注意:
  - このスクリプトは全てのデータを削除します
  - 本番環境では実行できません
  - 削除されたデータは復元できません
  `);
}

/**
 * 環境チェック
 */
function checkEnvironment() {
  // 本番環境でのリセットを防止
  if (process.env.NODE_ENV === 'production') {
    log.error('本番環境でのデータベースリセットは許可されていません');
    process.exit(1);
  }

  // データベースURL確認
  if (!process.env.DATABASE_URL) {
    log.error('DATABASE_URL環境変数が設定されていません');
    process.exit(1);
  }

  // SQLiteファイルの存在確認
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace('file:', '');
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
    
    if (!fs.existsSync(absolutePath)) {
      log.warning(`データベースファイルが存在しません: ${absolutePath}`);
      log.info('新しいデータベースが作成されます');
    }
  }
}

/**
 * ユーザー確認
 */
async function confirmReset() {
  if (forceFlag) {
    log.info('--forceフラグが指定されているため、確認をスキップします');
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.red}警告: この操作により全てのデータが削除されます。続行しますか？ (yes/no): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      }
    );
  });
}

/**
 * テーブル情報の取得
 */
async function getTableInfo() {
  try {
    // SQLiteのテーブル一覧を取得
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_prisma_%'
      ORDER BY name
    `;

    for (const table of tables) {
      // 各テーブルのレコード数を取得
      const count = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${table.name}"`
      );
      table.count = count[0].count;
    }

    return tables;
  } catch (error) {
    log.error(`テーブル情報の取得に失敗しました: ${error.message}`);
    return [];
  }
}

/**
 * データベースのリセット
 */
async function resetDatabase() {
  log.section('データベースリセット処理開始');

  try {
    // 現在のテーブル状態を表示
    log.info('現在のテーブル状態を確認中...');
    const tablesBefore = await getTableInfo();
    
    if (tablesBefore.length === 0) {
      log.warning('テーブルが存在しません');
    } else {
      console.log('\n現在のテーブル:');
      for (const table of tablesBefore) {
        console.log(`  - ${table.name}: ${table.count} レコード`);
      }
    }

    // トランザクション開始
    log.info('\nデータ削除を開始します...');
    
    await prisma.$transaction(async (tx) => {
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

      let totalDeleted = 0;

      for (const tableName of deleteOrder) {
        try {
          // テーブルの存在確認
          const tableExists = await tx.$queryRawUnsafe(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
            tableName
          );

          if (tableExists.length > 0) {
            // データ削除
            const result = await tx.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
            
            // SQLiteの自動インクリメントをリセット
            await tx.$executeRawUnsafe(
              `DELETE FROM sqlite_sequence WHERE name=?`,
              tableName
            );

            log.success(`${tableName}: ${result} レコードを削除しました`);
            totalDeleted += result;
          } else {
            log.warning(`${tableName}: テーブルが存在しません`);
          }
        } catch (error) {
          log.error(`${tableName}: 削除失敗 - ${error.message}`);
          throw error;
        }
      }

      // 外部キー制約を再度有効化
      await tx.$executeRawUnsafe('PRAGMA foreign_keys = ON');

      log.success(`\n合計 ${totalDeleted} レコードを削除しました`);
    });

    // リセット後のテーブル状態を確認
    log.info('\nリセット後のテーブル状態を確認中...');
    const tablesAfter = await getTableInfo();
    
    if (tablesAfter.length > 0) {
      console.log('\nリセット後のテーブル:');
      for (const table of tablesAfter) {
        const status = table.count === 0 ? '✓' : '✗';
        console.log(`  ${status} ${table.name}: ${table.count} レコード`);
      }
    }

    // データベース最適化（SQLite VACUUM）
    log.info('\nデータベースを最適化中...');
    await prisma.$executeRawUnsafe('VACUUM');
    log.success('データベースの最適化が完了しました');

    log.section('データベースリセット完了');
    
    return true;
  } catch (error) {
    log.error(`リセット処理中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log(`${colors.magenta}================================${colors.reset}`);
  console.log(`${colors.magenta}  データベースリセットスクリプト  ${colors.reset}`);
  console.log(`${colors.magenta}================================${colors.reset}\n`);

  // ヘルプ表示
  if (helpFlag) {
    showHelp();
    process.exit(0);
  }

  try {
    // 環境チェック
    checkEnvironment();
    
    log.info(`環境: ${process.env.NODE_ENV || 'development'}`);
    log.info(`データベース: ${process.env.DATABASE_URL.substring(0, 30)}...`);

    // 確認プロンプト
    const confirmed = await confirmReset();
    if (!confirmed) {
      log.warning('リセット処理をキャンセルしました');
      process.exit(0);
    }

    // リセット実行
    await resetDatabase();

    log.success('\n全ての処理が正常に完了しました');
    process.exit(0);

  } catch (error) {
    log.error(`\n致命的なエラーが発生しました: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Prisma接続を閉じる
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { resetDatabase };