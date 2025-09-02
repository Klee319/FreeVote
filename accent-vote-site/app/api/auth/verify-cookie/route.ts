import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * Cookie検証APIプロキシ
 * フロントエンドからのCookie検証リクエストをバックエンドにプロキシする
 */
export async function GET(request: NextRequest) {
  try {
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    console.log('[API Proxy] Verifying cookie:', {
      url: `${BACKEND_API_URL}/api/auth/verify-cookie`,
      hasCookie: !!cookieHeader
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/auth/verify-cookie`, {
      method: 'GET',
      headers: {
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
    });
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend verify-cookie response:', {
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
    console.error('[API Proxy] Error verifying cookie:', error);
    return NextResponse.json(
      { success: false, message: 'Cookie検証中にエラーが発生しました' },
      { status: 500 }
    );
  }
}