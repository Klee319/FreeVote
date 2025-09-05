/**
 * 設定値管理APIのテストスクリプト
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// テスト用のaxiosインスタンス
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// エラーハンドリング
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    throw error;
  }
);

/**
 * 全設定値の取得テスト
 */
async function testGetAllSettings() {
  console.log('\n=== 全設定値の取得 ===');
  try {
    const response = await api.get('/settings');
    console.log('✓ 設定値の取得成功');
    console.log('  設定値数:', response.data.data.length);
    
    // いくつかの設定値を表示
    response.data.data.slice(0, 5).forEach(setting => {
      console.log(`  - ${setting.key}: ${JSON.stringify(setting.value)} (${setting.type})`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error('✗ 設定値の取得失敗');
    throw error;
  }
}

/**
 * 特定設定値の取得テスト
 */
async function testGetSetting(key) {
  console.log(`\n=== 特定設定値の取得: ${key} ===`);
  try {
    const response = await api.get(`/settings/${key}`);
    console.log('✓ 設定値の取得成功');
    console.log('  キー:', response.data.data.key);
    console.log('  値:', response.data.data.value);
    console.log('  型:', response.data.data.type);
    console.log('  説明:', response.data.data.description);
    
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✗ 設定値が見つかりません');
    } else {
      console.error('✗ 設定値の取得失敗');
    }
    throw error;
  }
}

/**
 * 設定値の更新テスト（認証なしで失敗することを確認）
 */
async function testUpdateSettingWithoutAuth(key, value) {
  console.log(`\n=== 設定値の更新（認証なし）: ${key} ===`);
  try {
    await api.put(`/settings/${key}`, { value });
    console.log('✗ 認証なしで更新できてしまいました（エラー）');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✓ 正しく認証エラーが返されました');
    } else {
      console.error('✗ 予期しないエラー');
      throw error;
    }
  }
}

/**
 * メインテスト関数
 */
async function runTests() {
  console.log('=================================');
  console.log('  設定値管理API テスト開始');
  console.log('=================================');
  
  try {
    // 1. 全設定値の取得
    const settings = await testGetAllSettings();
    
    // 2. 特定設定値の取得（存在する設定値）
    if (settings.length > 0) {
      await testGetSetting(settings[0].key);
    }
    
    // 3. 特定設定値の取得（存在しない設定値）
    try {
      await testGetSetting('non.existent.key');
    } catch (e) {
      // 404エラーは期待される動作
    }
    
    // 4. 設定値の更新（認証なし）
    if (settings.length > 0) {
      await testUpdateSettingWithoutAuth(settings[0].key, 999);
    }
    
    console.log('\n=================================');
    console.log('  テスト完了');
    console.log('=================================');
    
  } catch (error) {
    console.error('\nテストが失敗しました:', error.message);
    process.exit(1);
  }
}

// テスト実行
runTests().catch(console.error);