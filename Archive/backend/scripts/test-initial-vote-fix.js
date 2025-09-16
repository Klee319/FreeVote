// 初回投票エラー修正のテストスクリプト
// 初回投票時にAccentTypeリレーションが正しく設定されることを確認

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3003';

// テスト用の一意なデバイスID生成
function generateTestDeviceId() {
  return `test-device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function testInitialVote() {
  console.log('=== 初回投票テスト ===');
  
  const testDeviceId = generateTestDeviceId();
  console.log(`テスト用デバイスID: ${testDeviceId}`);
  
  try {
    // Step 1: 新しい語に対する初回投票を実行
    console.log('\n📝 初回投票を実行中...');
    
    // テスト対象: wordId=1, accentTypeId=1 (頭高)
    const voteData = {
      wordId: 1,
      accentTypeId: 1,
      prefectureCode: '13' // 東京都
    };
    
    const voteResponse = await fetch(`${API_BASE_URL}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': testDeviceId,
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify(voteData)
    });
    
    const voteResult = await voteResponse.json();
    
    if (voteResult.success) {
      console.log('✅ 投票成功');
      console.log(`  投票ID: ${voteResult.data.id}`);
      console.log(`  語ID: ${voteResult.data.wordId}`);
      console.log(`  アクセント型ID: ${voteResult.data.accentTypeId}`);
      
      // Step 2: 投票直後の統計データを確認
      if (voteResult.data.stats) {
        console.log('\n📊 投票直後の統計データ:');
        
        // 全国統計の確認
        if (voteResult.data.stats.national && voteResult.data.stats.national.length > 0) {
          console.log('  全国統計:');
          voteResult.data.stats.national.forEach(stat => {
            console.log(`    - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
            console.log(`      voteCount: ${stat.voteCount}`);
          });
        } else {
          console.log('  ❌ 全国統計データがありません');
        }
        
        // 都道府県統計の確認
        if (voteResult.data.stats.byPrefecture && voteResult.data.stats.byPrefecture.length > 0) {
          console.log('  都道府県統計:');
          voteResult.data.stats.byPrefecture.forEach(stat => {
            console.log(`    - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
            console.log(`      prefectureCode: ${stat.prefectureCode}`);
            console.log(`      voteCount: ${stat.voteCount}`);
          });
        } else {
          console.log('  ❌ 都道府県統計データがありません');
        }
      } else {
        console.log('  ❌ 統計データが返されませんでした');
      }
      
      // Step 3: 別途統計APIで確認
      console.log('\n🔍 統計API経由での確認...');
      
      const statsResponse = await fetch(`${API_BASE_URL}/api/votes/stats/${voteData.wordId}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success && statsData.data) {
        console.log('✅ 統計API取得成功');
        
        if (statsData.data.national && statsData.data.national.length > 0) {
          console.log('  全国統計 (統計API):');
          statsData.data.national.forEach(stat => {
            console.log(`    - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
          });
        }
      } else {
        console.log('❌ 統計API取得失敗');
      }
      
      // Step 4: Word詳細APIでも確認
      console.log('\n🔍 Word詳細API経由での確認...');
      
      const wordResponse = await fetch(`${API_BASE_URL}/api/words/${voteData.wordId}`, {
        headers: {
          'x-device-id': testDeviceId
        }
      });
      const wordData = await wordResponse.json();
      
      if (wordData.success && wordData.data && wordData.data.nationalStats) {
        console.log('✅ Word詳細API取得成功');
        console.log('  nationalStats:');
        wordData.data.nationalStats.forEach(stat => {
          console.log(`    - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
        });
      } else {
        console.log('❌ Word詳細API取得失敗');
      }
      
      return voteResult.data.id; // 投票IDを返す（クリーンアップ用）
      
    } else {
      console.log('❌ 投票失敗:', voteResult.message);
      console.log('詳細:', voteResult);
      return null;
    }
    
  } catch (error) {
    console.error('❌ テスト中にエラー:', error.message);
    return null;
  }
}

async function cleanupTestVote(voteId, deviceId) {
  if (!voteId || !deviceId) return;
  
  console.log('\n🧹 テストデータクリーンアップ中...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}`, {
      method: 'DELETE',
      headers: {
        'x-device-id': deviceId
      }
    });
    
    if (response.ok) {
      console.log('✅ テストデータ削除成功');
    } else {
      console.log('⚠️ テストデータ削除失敗（手動削除が必要かもしれません）');
    }
  } catch (error) {
    console.log('⚠️ テストデータ削除エラー:', error.message);
  }
}

async function testExistingWordStats() {
  console.log('\n=== 既存語の統計確認テスト ===');
  
  try {
    // 既存のデータがある語の統計を確認
    const response = await fetch(`${API_BASE_URL}/api/votes/stats/1`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ 既存語統計取得成功');
      
      if (data.data.national && data.data.national.length > 0) {
        console.log('📊 既存全国統計:');
        data.data.national.forEach(stat => {
          console.log(`  - accentType: ${typeof stat.accentType === 'string' ? '✅ 文字列' : '❌ オブジェクト'} (値: ${JSON.stringify(stat.accentType)})`);
          console.log(`    voteCount: ${stat.voteCount}`);
        });
      } else {
        console.log('📊 全国統計データなし');
      }
    } else {
      console.log('❌ 既存語統計取得失敗');
    }
  } catch (error) {
    console.error('❌ 既存語統計テスト中にエラー:', error.message);
  }
}

async function runTests() {
  console.log('🔧 初回投票エラー修正テスト開始\n');
  console.log('期待される結果:');
  console.log('  1. 初回投票が500エラーなく成功すること');
  console.log('  2. 統計データのaccentTypeフィールドが文字列であること');
  console.log('  3. AccentTypeリレーションが正しく設定されていること\n');
  
  // 既存データの確認
  await testExistingWordStats();
  
  // 初回投票テスト
  const testDeviceId = generateTestDeviceId();
  const voteId = await testInitialVote();
  
  // クリーンアップ（オプション）
  if (voteId && testDeviceId) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    await cleanupTestVote(voteId, testDeviceId);
  }
  
  console.log('\n✅ テスト完了');
}

// node-fetchが無い場合の代替
if (typeof fetch === 'undefined') {
  console.log('⚠️ node-fetchをインストールしてください: npm install node-fetch@2');
  console.log('または、以下のエンドポイントを手動でテストしてください:');
  console.log('  1. POST http://localhost:3001/api/votes (初回投票)');
  console.log('     Body: {"wordId": 1, "accentTypeId": 1, "prefectureCode": "13"}');
  console.log('     Headers: {"x-device-id": "test-device-123"}');
  console.log('  2. GET http://localhost:3001/api/votes/stats/1');
  console.log('  3. GET http://localhost:3001/api/words/1');
} else {
  runTests();
}