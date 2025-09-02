import { NextRequest, NextResponse } from 'next/server';

// バックエンドAPIのURL（環境変数から取得、デフォルトはlocalhost:3003）
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3003';

/**
 * 投票可能チェックAPIプロキシ
 * フロントエンドからのチェックリクエストをバックエンドにプロキシする
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    const { wordId } = await params;
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    console.log('[API Proxy] Checking if can vote for word:', {
      wordId,
      url: `${BACKEND_API_URL}/api/votes/can-vote/${wordId}`,
      hasCookie: !!cookieHeader
    });
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${BACKEND_API_URL}/api/votes/can-vote/${wordId}`, {
      method: 'GET',
      headers: {
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
    });
    
    const data = await response.json();
    
    console.log('[API Proxy] Backend can-vote response:', {
      status: response.status,
      data
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error checking can vote:', error);
    // エラー時はデフォルトで投票可能として扱う
    return NextResponse.json(
      { canVote: true },
      { status: 200 }
    );
  }
}