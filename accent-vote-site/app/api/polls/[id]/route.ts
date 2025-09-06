import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * GET /api/polls/:id - 投票詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // バックエンドAPIを呼び出し
    const response = await fetch(
      `${BACKEND_URL}/api/polls/${params.id}`,
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
    console.error('Error fetching poll detail:', error);
    return NextResponse.json(
      { success: false, message: '投票詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}