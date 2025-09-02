import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 属性更新APIプロキシ
 * フロントエンドからの属性更新リクエストをバックエンドにプロキシする
 */
export async function PUT(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    // CSRFトークンを取得
    const csrfToken = request.headers.get('x-csrf-token');
    
    console.log('[API Proxy] Forwarding attributes update to backend:', {
      url: `${BACKEND_API_URL}/api/auth/attributes`,
      hasBody: !!body,
      hasCookie: !!cookieHeader,
      hasCsrfToken: !!csrfToken,
      bodyContent: body
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/auth/attributes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        // CSRFトークンを転送
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend attributes response:', {
      status: response.status,
      data
    });
    
    // レスポンスを作成
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Set-Cookieヘッダーを転送（複数のCookieに対応）
    const setCookieHeaders = response.headers.getSetCookie ? 
      response.headers.getSetCookie() : 
      [response.headers.get('set-cookie')].filter(Boolean);
    
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        if (cookie) {
          nextResponse.headers.append('set-cookie', cookie);
        }
      });
    }
    
    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error updating attributes:', error);
    return NextResponse.json(
      { success: false, message: '属性更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}