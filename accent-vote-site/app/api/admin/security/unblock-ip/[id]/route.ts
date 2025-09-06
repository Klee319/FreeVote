import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 実際のプロダクションではデータベースから削除
    
    return NextResponse.json({
      message: 'IPアドレスのブロックを解除しました',
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return NextResponse.json(
      { error: 'ブロック解除に失敗しました' },
      { status: 500 }
    );
  }
}