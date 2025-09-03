import fetch from 'node-fetch';

async function testVote() {
  const baseUrl = 'http://localhost:3003/api';
  const timestamp = Date.now();
  const baseDeviceId = 'test-device-' + timestamp;
  
  // Test 1: AccentType IDを直接使用（1-4）
  console.log('Test 1: AccentType IDを直接使用');
  try {
    const response1 = await fetch(`${baseUrl}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': baseDeviceId + '-1',
      },
      body: JSON.stringify({
        wordId: 1, // 桜
        accentTypeId: 1, // 平板型
      }),
    });
    
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 2: AccentOption IDを使用（> 4）
  console.log('\nTest 2: AccentOption IDを使用（ID: 13）');
  try {
    const response2 = await fetch(`${baseUrl}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': baseDeviceId + '-2',
      },
      body: JSON.stringify({
        wordId: 5, // 紅葉
        accentTypeId: 13, // AccentOption ID for 紅葉の中高型
      }),
    });
    
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 3: 無効なAccentOption IDを使用
  console.log('\nTest 3: 無効なIDを使用（ID: 999）');
  try {
    const response3 = await fetch(`${baseUrl}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': baseDeviceId + '-3',
      },
      body: JSON.stringify({
        wordId: 1,
        accentTypeId: 999, // 無効なID
      }),
    });
    
    const data3 = await response3.json();
    console.log('Response:', JSON.stringify(data3, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 4: AccentOption IDと不整合なwordIdを使用
  console.log('\nTest 4: AccentOption IDと不整合なwordIdを使用');
  try {
    const response4 = await fetch(`${baseUrl}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': baseDeviceId + '-4',
      },
      body: JSON.stringify({
        wordId: 1, // 桜
        accentTypeId: 13, // 紅葉のAccentOption ID
      }),
    });
    
    const data4 = await response4.json();
    console.log('Response:', JSON.stringify(data4, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testVote();