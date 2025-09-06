import { NextRequest, NextResponse } from 'next/server';

// メモリ内でブロックIPを管理（実際のプロダクションではデータベースを使用）
let blockedIPs: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { ipAddress, reason } = await request.json();

    if (!ipAddress || !reason) {
      return NextResponse.json(
        { error: 'IPアドレスと理由が必要です' },
        { status: 400 }
      );
    }

    const newBlockedIP = {
      id: `ip-${Date.now()}`,
      ipAddress,
      reason,
      blockedAt: new Date().toISOString(),
      expiresAt: null,
      autoBlocked: false,
    };

    blockedIPs.push(newBlockedIP);

    return NextResponse.json({
      message: 'IPアドレスをブロックしました',
      blockedIP: newBlockedIP,
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    return NextResponse.json(
      { error: 'IPアドレスのブロックに失敗しました' },
      { status: 500 }
    );
  }
}