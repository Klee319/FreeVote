import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 匿名登録APIプロキシ
 * フロントエンドからの匿名登録リクエストをバックエンドにプロキシする
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    // 匿名登録リクエストのAPIプロキシ処理
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/auth/anonymous-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // 登録レスポンス処理済み
    
    // レスポンスを作成
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Set-Cookieヘッダーを転送（複数のCookieに対応）
    // Next.js 13+ではgetSetCookie()メソッドが利用可能
    let setCookieHeaders: string[] = [];
    
    // Node.js 19.7.0+のgetSetCookie()メソッドを安全に使用
    const headersWithGetSetCookie = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    
    if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
      setCookieHeaders = headersWithGetSetCookie.getSetCookie();
    } else {
      // フォールバック: 単一のset-cookieヘッダーを取得
      const singleCookie = response.headers.get('set-cookie');
      if (singleCookie) {
        setCookieHeaders = [singleCookie];
      }
    }
    
    // Set-Cookieヘッダーの処理
    
    // Set-Cookieヘッダーを個別に追加
    setCookieHeaders.forEach((cookie: string) => {
      if (cookie) {
        nextResponse.headers.append('set-cookie', cookie);
      }
    });
    
    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error forwarding registration:', error);
    return NextResponse.json(
      { success: false, message: '登録処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}