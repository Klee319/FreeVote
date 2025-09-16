import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 投票APIプロキシ
 * フロントエンドからの投票リクエストをバックエンドにプロキシする
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    console.log('[API Proxy] Forwarding vote request to backend:', {
      url: `${BACKEND_API_URL}/api/votes`,
      hasBody: !!body,
      hasCookie: !!cookieHeader,
      hasUserId: !!body?.userId,
      hasDeviceId: !!body?.deviceId,
      bodyContent: {
        ...body,
        userId: body?.userId ? 'provided' : 'not provided'
      }
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
      body: JSON.stringify(body),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('[API Proxy] Failed to parse response as JSON:', error);
      data = { success: false, message: 'サーバーエラーが発生しました' };
    }
    
    console.log('[API Proxy] Backend response:', {
      status: response.status,
      hasStats: !!(data?.stats || data?.statistics),
      success: data?.success
    });
    
    // レスポンスヘッダーからSet-Cookieを取得
    const setCookieHeader = response.headers.get('set-cookie');
    
    // レスポンスを作成
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Set-Cookieヘッダーがあれば転送
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error forwarding vote request:', error);
    
    // エラーメッセージをより詳細に
    let message = '投票処理中にエラーが発生しました';
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        message = 'サーバーに接続できません。しばらくお待ちください。';
      } else if (error.message.includes('timeout')) {
        message = 'サーバーの応答がありません。もう一度お試しください。';
      }
    }
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}