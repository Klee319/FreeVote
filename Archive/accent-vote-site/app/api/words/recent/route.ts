import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 新着語APIプロキシ
 * /api/words/recent エンドポイント
 * フロントエンドからの新着語リクエストをバックエンドにプロキシする
 */
export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    console.log('[API Proxy] Forwarding words/recent request to backend:', {
      url: `${BACKEND_API_URL}/api/words/recent${queryString ? `?${queryString}` : ''}`,
      hasCookie: !!cookieHeader,
      queryParams: Object.fromEntries(searchParams.entries())
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/words/recent${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend response:', {
      status: response.status,
      dataKeys: Object.keys(data),
      hasWords: !!data.data?.words,
      wordCount: data.data?.words?.length || 0
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
    console.error('[API Proxy] Error forwarding words/recent request:', error);
    return NextResponse.json(
      { success: false, message: '新着語データの取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}