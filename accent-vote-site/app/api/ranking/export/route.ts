import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * ランキングエクスポートAPIプロキシ
 * フロントエンドからのCSVエクスポートリクエストをバックエンドにプロキシする
 */
export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    
    // period パラメータの変換 (daily -> 7d, weekly -> 7d, monthly -> 30d)
    const period = searchParams.get('period');
    if (period) {
      searchParams.delete('period');
      if (period === 'daily' || period === 'weekly') {
        searchParams.set('period', '7d');
      } else if (period === 'monthly') {
        searchParams.set('period', '30d');
      } else {
        searchParams.set('period', period); // その他の値はそのまま
      }
    }
    
    const queryString = searchParams.toString();
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    console.log('[API Proxy] Forwarding ranking export request to backend:', {
      url: `${BACKEND_API_URL}/api/ranking/export${queryString ? `?${queryString}` : ''}`,
      hasCookie: !!cookieHeader,
      queryParams: Object.fromEntries(searchParams.entries())
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/ranking/export${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
      credentials: 'include'
    });
    
    // CSVデータを取得
    const csvData = await response.text();
    
    console.log('[API Proxy] Backend response:', {
      status: response.status,
      contentLength: csvData.length
    });
    
    // レスポンスヘッダーからSet-Cookieを取得
    const setCookieHeader = response.headers.get('set-cookie');
    
    // CSVレスポンスを作成
    const nextResponse = new NextResponse(csvData, {
      status: response.status,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="ranking.csv"'
      }
    });
    
    // Set-Cookieヘッダーがあれば転送
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error forwarding ranking export request:', error);
    return NextResponse.json(
      { success: false, message: 'CSVエクスポート中にエラーが発生しました' },
      { status: 500 }
    );
  }
}