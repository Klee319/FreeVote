/**
 * 新規登録APIのテストスクリプト
 * バリデーションエラーが解決されたかを確認
 */

const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth/register';

async function testRegistration() {
  console.log('=== 新規登録APIテスト ===\n');

  // テストケース1: 日本語値での正常な登録
  const testData1 = {
    email: `test${Date.now()}@example.com`,
    password: 'testPassword123',
    username: 'テストユーザー',
    ageGroup: '20代',
    prefecture: '京都府',
    gender: '男性'
  };

  console.log('テストケース1: 日本語値での登録');
  console.log('送信データ:', JSON.stringify(testData1, null, 2));

  try {
    const response = await axios.post(API_URL, testData1);
    console.log('✅ 登録成功!');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ エラー発生:');
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('エラー詳細:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('エラー:', error.message);
    }
  }

  console.log('\n---\n');

  // テストケース2: 英語値でのエラー確認（修正前の値）
  const testData2 = {
    email: `test${Date.now()}@example.com`,
    password: 'testPassword123',
    username: 'Test User',
    ageGroup: '20s',  // 英語値
    prefecture: 'kyoto',  // 英語値
    gender: 'male'  // 英語値
  };

  console.log('テストケース2: 英語値での登録（エラー期待）');
  console.log('送信データ:', JSON.stringify(testData2, null, 2));

  try {
    const response = await axios.post(API_URL, testData2);
    console.log('⚠️ 予期しない成功（英語値が受け入れられました）');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✅ 期待通りのエラー:');
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('エラー詳細:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('エラー:', error.message);
    }
  }
}

// メイン実行
(async () => {
  try {
    await testRegistration();
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
})();