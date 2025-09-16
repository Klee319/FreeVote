import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';

/**
 * GET /api/admin/polls - 管理画面用の投票一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    const searchParams = request.nextUrl.searchParams;

    // 管理者認証がある場合はトークンを送信
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // バックエンドAPIを呼び出し（通常の投票一覧エンドポイントを使用）
    const response = await fetch(
      `${BACKEND_URL}/api/polls?${searchParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching admin polls:', error);
    return NextResponse.json(
      { success: false, message: '管理画面用投票一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/polls - 投票の削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('id');

    if (!pollId) {
      return NextResponse.json(
        { success: false, message: '投票IDが指定されていません' },
        { status: 400 }
      );
    }

    // 管理者認証がある場合はトークンを送信
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // バックエンドAPIを呼び出し
    const response = await fetch(
      `${BACKEND_URL}/api/polls/${pollId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    return NextResponse.json({ success: true, message: '投票を削除しました' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json(
      { success: false, message: '投票の削除に失敗しました' },
      { status: 500 }
    );
  }
}