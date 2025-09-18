#!/usr/bin/env node

/**
 * 安全な開発サーバー再起動スクリプト
 *
 * このスクリプトは以下の処理を行います：
 * 1. 既存の開発サーバープロセスの停止（ポート3000）
 * 2. ビルドキャッシュのクリーンアップ
 * 3. 開発サーバーの再起動
 */

const { exec, execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

// Windowsかどうかの判定
const isWindows = process.platform === 'win32';

// ポート3000を使用しているプロセスを見つけて終了する
function killPort3000() {
  return new Promise((resolve) => {
    if (isWindows) {
      // Windowsの場合 - PowerShellを使用して安全に処理
      exec('powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('✅ ポート3000は使用されていません');
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n').map(pid => pid.trim()).filter(pid => pid && pid !== '0');

        if (pids.length > 0) {
          console.log(`🔍 ポート3000を使用しているプロセス(PID: ${pids.join(', ')})を終了します...`);
          pids.forEach(pid => {
            try {
              execSync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
            } catch (e) {
              // エラーを無視
            }
          });
          console.log('✅ 既存のプロセスを終了しました');
        }

        resolve();
      });
    } else {
      // Unix/Linux/Macの場合
      exec('lsof -ti :3000', (error, stdout) => {
        if (error || !stdout) {
          console.log('✅ ポート3000は使用されていません');
          resolve();
          return;
        }

        const pid = stdout.trim();
        console.log(`🔍 ポート3000を使用しているプロセス(PID: ${pid})を終了します...`);

        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log('✅ 既存のプロセスを終了しました');
        } catch (e) {
          console.warn('⚠️  プロセス終了でエラーが発生しましたが、継続します');
        }

        resolve();
      });
    }
  });
}

// ビルドキャッシュのクリーンアップ
function cleanBuildCache() {
  console.log('🧹 ビルドキャッシュをクリーンアップしています...');

  const dirsToDelete = ['.next', 'node_modules/.cache', '.turbo'];

  dirsToDelete.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  ✅ 削除: ${dir}`);
      } catch (error) {
        console.log(`  ⚠️  削除失敗: ${dir}`);
      }
    }
  });

  console.log('✅ クリーンアップ完了');
}

// 開発サーバーの起動
function startDevServer() {
  console.log('\n🚀 開発サーバーを起動しています...\n');

  const npm = isWindows ? 'npm.cmd' : 'npm';
  const devServer = spawn(npm, ['run', 'dev'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  devServer.on('error', (err) => {
    console.error('❌ 開発サーバーの起動に失敗しました:', err);
    process.exit(1);
  });

  devServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`開発サーバーが終了しました (code: ${code})`);
    }
  });
}

// メイン処理
async function main() {
  console.log('🔄 開発サーバーの安全な再起動を開始します...\n');

  // 1. ポート3000のプロセスを終了
  await killPort3000();

  // 2. 少し待機
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. ビルドキャッシュをクリーンアップ
  cleanBuildCache();

  // 4. 少し待機
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 5. 開発サーバーを起動
  startDevServer();
}

// エラーハンドリング
process.on('SIGINT', () => {
  console.log('\n👋 終了します...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 終了します...');
  process.exit(0);
});

// 実行
main().catch(console.error);