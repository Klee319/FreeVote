import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';

/**
 * POST /api/polls - 新規投票作成
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    const body = await request.json();

    // 管理者認証がある場合はトークンを送信
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // バックエンドAPIを呼び出し
    const response = await fetch(
      `${BACKEND_URL}/api/polls`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { success: false, message: '投票の作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/polls - 投票一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // バックエンドAPIを呼び出し
    const response = await fetch(
      `${BACKEND_URL}/api/polls?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { success: false, message: '投票一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}