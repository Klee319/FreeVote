import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * セッションリフレッシュAPIプロキシ
 * フロントエンドからのセッションリフレッシュリクエストをバックエンドにプロキシする
 */
export async function PUT(request: NextRequest) {
  try {
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    // CSRFトークンを取得
    const csrfToken = request.headers.get('x-csrf-token');
    
    console.log('[API Proxy] Refreshing session:', {
      url: `${BACKEND_API_URL}/api/auth/refresh-session`,
      hasCookie: !!cookieHeader,
      hasCsrfToken: !!csrfToken
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/auth/refresh-session`, {
      method: 'PUT',
      headers: {
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        // CSRFトークンを転送
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
      },
    });
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend refresh-session response:', {
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
    console.error('[API Proxy] Error refreshing session:', error);
    return NextResponse.json(
      { success: false, message: 'セッション更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}