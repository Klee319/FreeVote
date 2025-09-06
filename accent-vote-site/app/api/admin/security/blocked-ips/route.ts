import { NextRequest, NextResponse } from 'next/server';

// メモリ内でブロックIPを管理（実際のプロダクションではデータベースを使用）
let blockedIPs: any[] = [
  {
    id: 'ip-1',
    ipAddress: '192.168.1.100',
    reason: '複数回のログイン失敗',
    blockedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    autoBlocked: true,
  },
  {
    id: 'ip-2',
    ipAddress: '10.0.0.50',
    reason: '不審なアクセスパターン',
    blockedAt: new Date(Date.now() - 172800000).toISOString(),
    expiresAt: null,
    autoBlocked: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ blockedIPs });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return NextResponse.json(
      { error: 'ブロックIPの取得に失敗しました' },
      { status: 500 }
    );
  }
}