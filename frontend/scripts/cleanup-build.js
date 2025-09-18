#!/usr/bin/env node

/**
 * ビルドキャッシュクリーンアップスクリプト
 *
 * このスクリプトは以下の処理を行います：
 * 1. .nextディレクトリの削除（段階的削除でWindowsファイルロック対応）
 * 2. node_modulesの.cacheディレクトリの削除
 * 3. その他のキャッシュディレクトリの削除
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const isWindows = process.platform === 'win32';

// 削除対象のディレクトリ
const dirsToDelete = [
  'node_modules/.cache',
  '.turbo',
  '.swc'
];

console.log('🧹 ビルドキャッシュのクリーンアップを開始します...\n');

// Windowsでの安全な.nextディレクトリ削除
async function safeRemoveNextDir() {
  const nextPath = path.join(projectRoot, '.next');

  if (!fs.existsSync(nextPath)) {
    console.log('⏭️  スキップ: .next (存在しません)');
    return true;
  }

  try {
    if (isWindows) {
      // Windowsの場合、コマンドラインで強制削除
      console.log('🗂️  .nextディレクトリを削除中... (Windows)');
      execSync(`rmdir /s /q "${nextPath}"`, { stdio: 'ignore' });
      console.log('✅ 削除成功: .next');
      return true;
    } else {
      // Unix系の場合
      fs.rmSync(nextPath, { recursive: true, force: true });
      console.log('✅ 削除成功: .next');
      return true;
    }
  } catch (error) {
    console.warn(`⚠️  .next削除中にエラー: ${error.message}`);

    // 代替手段を試行
    try {
      console.log('🔄 代替手段で.nextディレクトリを削除中...');
      if (isWindows) {
        // PowerShellを使用
        execSync(`powershell -Command "Remove-Item -Path '${nextPath}' -Recurse -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${nextPath}"`, { stdio: 'ignore' });
      }

      // 削除確認
      if (!fs.existsSync(nextPath)) {
        console.log('✅ 削除成功: .next (代替手段)');
        return true;
      } else {
        console.error('❌ .nextディレクトリの削除に失敗しました');
        console.error('💡 手動でNextディレクトリを削除してください:');
        console.error(`   削除対象: ${nextPath}`);
        return false;
      }
    } catch (fallbackError) {
      console.error('❌ .nextディレクトリの削除に完全に失敗しました');
      console.error('💡 以下の手順で手動削除してください:');
      console.error('   1. すべてのNode.jsプロセスを終了');
      console.error('   2. VSCodeやエディタを閉じる');
      console.error(`   3. フォルダを手動削除: ${nextPath}`);
      return false;
    }
  }
}

// 一般的なディレクトリの削除
function removeOtherDirs() {
  let hasErrors = false;

  dirsToDelete.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ 削除成功: ${dir}`);
      } catch (error) {
        console.error(`❌ 削除失敗: ${dir} - ${error.message}`);
        hasErrors = true;
      }
    } else {
      console.log(`⏭️  スキップ: ${dir} (存在しません)`);
    }
  });

  return !hasErrors;
}

// メイン処理
async function main() {
  const nextSuccess = await safeRemoveNextDir();
  const othersSuccess = removeOtherDirs();

  if (nextSuccess && othersSuccess) {
    console.log('\n🎉 クリーンアップが完了しました！');
    console.log('📝 次のコマンドで開発サーバーを再起動してください:');
    console.log('   npm run dev');
    process.exit(0);
  } else {
    console.log('\n⚠️  一部のクリーンアップでエラーが発生しました');
    console.log('💡 手動削除後、以下のコマンドで再試行してください:');
    console.log('   npm run clean');
    process.exit(1);
  }
}

// 実行
main().catch(error => {
  console.error('❌ クリーンアップ中にエラーが発生しました:', error);
  process.exit(1);
});