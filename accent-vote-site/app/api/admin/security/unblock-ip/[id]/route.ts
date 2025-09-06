import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 実際のプロダクションではデータベースから削除
    console.log(`Unblocking IP with ID: ${id}`);
    
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