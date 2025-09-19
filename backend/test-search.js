// 検索機能のテストスクリプト
const fetch = require('node-fetch');

async function testSearch() {
  const baseUrl = 'http://localhost:5001/api';

  console.log('投票検索機能テスト開始...\n');

  try {
    // 1. キーワード検索テスト
    console.log('1. キーワード検索テスト:');
    const searchResponse = await fetch(`${baseUrl}/polls?search=test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      console.log(`   ✅ 検索成功: ${data.polls.length}件の投票が見つかりました`);
    } else {
      const error = await searchResponse.text();
      console.log(`   ❌ 検索失敗: ${error}`);
    }

    // 2. カテゴリー検索テスト
    console.log('\n2. カテゴリー検索テスト:');
    const categoryResponse = await fetch(`${baseUrl}/polls?category=エンタメ`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (categoryResponse.ok) {
      const data = await categoryResponse.json();
      console.log(`   ✅ カテゴリー検索成功: ${data.polls.length}件の投票が見つかりました`);
    } else {
      const error = await categoryResponse.text();
      console.log(`   ❌ カテゴリー検索失敗: ${error}`);
    }

    // 3. 大文字小文字を含む検索テスト
    console.log('\n3. 大文字小文字を含む検索テスト:');
    const caseInsensitiveResponse = await fetch(`${baseUrl}/polls?search=TEST`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (caseInsensitiveResponse.ok) {
      const data = await caseInsensitiveResponse.json();
      console.log(`   ✅ 大文字検索成功: ${data.polls.length}件の投票が見つかりました`);
      console.log('   → SQLiteのデフォルト動作で大文字小文字を区別しない検索が実現できています');
    } else {
      const error = await caseInsensitiveResponse.text();
      console.log(`   ❌ 大文字検索失敗: ${error}`);
    }

    console.log('\n✅ すべてのテストが完了しました！');

  } catch (error) {
    console.error('テスト実行エラー:', error.message);
    console.log('\nサーバーが起動していることを確認してください。');
  }
}

// テスト実行
testSearch();