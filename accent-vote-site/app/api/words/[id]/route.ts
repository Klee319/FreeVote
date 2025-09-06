import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 語詳細取得APIプロキシ
 * フロントエンドからのリクエストをバックエンドにプロキシする
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wordId } = await params;
    
    // Cookieヘッダーを取得（認証情報の転送用）
    const cookieHeader = request.headers.get('cookie');
    
    // デバイスIDヘッダーを取得
    const deviceIdHeader = request.headers.get('x-device-id');
    
    console.log('[API Proxy] Fetching word detail:', {
      wordId,
      url: `${BACKEND_API_URL}/api/words/${wordId}`,
      hasCookie: !!cookieHeader,
      hasDeviceId: !!deviceIdHeader
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/words/${wordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        // デバイスIDを転送
        ...(deviceIdHeader ? { 'X-Device-ID': deviceIdHeader } : {})
      },
    });
    
    // レスポンスの処理
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('[API Proxy] Failed to parse response as JSON:', error);
      return NextResponse.json(
        { success: false, message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }
    
    console.log('[API Proxy] Backend response:', {
      status: response.status,
      success: data?.success,
      hasData: !!data?.data,
      hasWord: !!data?.data?.word,
      totalVotes: data?.data?.word?.totalVotes,
      hasNationalStats: !!data?.data?.nationalStats,
      nationalStatsCount: data?.data?.nationalStats?.length
    });
    
    // エラーレスポンスの処理
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    // 成功レスポンス
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API Proxy] Error fetching word detail:', error);
    
    // エラーメッセージをより詳細に
    let message = '語の詳細取得中にエラーが発生しました';
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