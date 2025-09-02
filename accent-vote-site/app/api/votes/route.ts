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
      bodyContent: body
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
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend response:', {
      status: response.status,
      data
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
    return NextResponse.json(
      { success: false, message: '投票処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}