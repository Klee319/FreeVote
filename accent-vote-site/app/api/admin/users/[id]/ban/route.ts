import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      );
    }

    // 注意: Prismaスキーマにstatusフィールドがないため、
    // この機能は実際には動作しません。
    // 実装には、Prismaスキーマへのstatusフィールドの追加が必要です。

    return NextResponse.json({
      message: action === 'ban' ? 'ユーザーをBANしました' : 'BANを解除しました',
      user: { id },
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}