// AccentType修正のテストスクリプト
// 修正後、accentTypeフィールドが文字列（code）のみを返すことを確認

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

async function testVoteStatsAPI() {
  console.log('=== Vote Stats API テスト ===');
  
  try {
    // wordId=1の統計データを取得
    const response = await fetch(`${API_BASE_URL}/api/votes/stats/1`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('\n✅ APIレスポンス取得成功');
      
      // national統計の確認
      if (data.data.national && data.data.national.length > 0) {
        console.log('\n📊 全国統計:');
        data.data.national.forEach(stat => {
          console.log(`  - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
          console.log(`    voteCount: ${stat.voteCount}`);
        });
      }
      
      // prefecture統計の確認
      if (data.data.byPrefecture && data.data.byPrefecture.length > 0) {
        console.log('\n🗾 都道府県別統計 (最初の3件):');
        data.data.byPrefecture.slice(0, 3).forEach(stat => {
          console.log(`  - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
          console.log(`    prefectureCode: ${stat.prefectureCode}`);
        });
      }
    } else {
      console.log('❌ APIレスポンスにデータがありません');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

async function testWordDetailAPI() {
  console.log('\n=== Word Detail API テスト ===');
  
  try {
    // wordId=1の詳細データを取得
    const response = await fetch(`${API_BASE_URL}/api/words/1`, {
      headers: {
        'x-device-id': 'test-device-001'
      }
    });
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('\n✅ APIレスポンス取得成功');
      
      // nationalStats の確認
      if (data.data.nationalStats && data.data.nationalStats.length > 0) {
        console.log('\n📊 nationalStats:');
        data.data.nationalStats.forEach(stat => {
          console.log(`  - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
        });
      }
    } else {
      console.log('❌ APIレスポンスにデータがありません');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

async function runTests() {
  console.log('🔧 AccentType修正テスト開始\n');
  console.log('期待される結果: accentTypeフィールドは文字列（"atamadaka", "heiban"など）であること\n');
  
  await testVoteStatsAPI();
  await testWordDetailAPI();
  
  console.log('\n✅ テスト完了');
}

// node-fetchが無い場合の代替
if (typeof fetch === 'undefined') {
  console.log('⚠️ node-fetchをインストールしてください: npm install node-fetch@2');
  console.log('または、HTTPクライアントツール（Postman、curl等）で以下のエンドポイントを確認してください:');
  console.log('  - GET http://localhost:3001/api/votes/stats/1');
  console.log('  - GET http://localhost:3001/api/words/1');
} else {
  runTests();
}