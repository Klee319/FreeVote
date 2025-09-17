const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// テスト用の認証情報
const testCredentials = {
  email: 'test@example.com',
  password: 'wrongpassword' // 意図的に間違ったパスワードでエラーレスポンスを確認
};

async function testLogin() {
  console.log('Testing login endpoint with wrong credentials...');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, testCredentials);
    console.log('Success response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', JSON.stringify(error.response.data, null, 2));

      // エラーレスポンスの形式を確認
      if (error.response.data?.error?.message) {
        console.log('✓ Error message found in error.message:', error.response.data.error.message);
      } else if (error.response.data?.message) {
        console.log('✓ Error message found in message:', error.response.data.message);
      } else {
        console.log('✗ No error message found in expected locations');
      }
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// 正しい認証情報でのテスト
async function testSuccessfulLogin() {
  console.log('\nTesting login endpoint with correct credentials...');

  // まずユーザーを登録
  const registerData = {
    email: 'test@example.com',
    password: 'Test1234!',
    username: 'testuser',
    ageGroup: '20-29',
    prefecture: '東京都'
  };

  try {
    // 既存のユーザーがいる可能性があるので、エラーは無視
    await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('User registered successfully');
  } catch (error) {
    console.log('Registration failed (user might already exist)');
  }

  // ログイン試行
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });

    console.log('Login successful!');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));

    if (response.data?.data?.accessToken) {
      console.log('✓ Access token received');
    }
    if (response.data?.data?.user) {
      console.log('✓ User data received');
    }
  } catch (error) {
    console.log('Login failed:', error.response?.data || error.message);
  }
}

// テスト実行
async function runTests() {
  console.log('Starting API tests...\n');
  await testLogin();
  await testSuccessfulLogin();
  console.log('\nTests completed');
}

runTests();