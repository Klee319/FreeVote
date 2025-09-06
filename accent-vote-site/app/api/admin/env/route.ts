import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 環境変数のリスト（セキュリティのため一部のみ表示）
    const variables = [
      {
        key: 'NODE_ENV',
        value: process.env.NODE_ENV || 'development',
        isSecret: false,
      },
      {
        key: 'DATABASE_URL',
        value: process.env.DATABASE_URL ? '••••••••' : '(未設定)',
        isSecret: true,
      },
      {
        key: 'NEXTAUTH_URL',
        value: process.env.NEXTAUTH_URL || '(未設定)',
        isSecret: false,
      },
      {
        key: 'NEXTAUTH_SECRET',
        value: process.env.NEXTAUTH_SECRET ? '••••••••' : '(未設定)',
        isSecret: true,
      },
      {
        key: 'GOOGLE_CLIENT_ID',
        value: process.env.GOOGLE_CLIENT_ID || '(未設定)',
        isSecret: false,
      },
      {
        key: 'GOOGLE_CLIENT_SECRET',
        value: process.env.GOOGLE_CLIENT_SECRET ? '••••••••' : '(未設定)',
        isSecret: true,
      },
      {
        key: 'REDIS_URL',
        value: process.env.REDIS_URL || '(未設定)',
        isSecret: false,
      },
      {
        key: 'SMTP_HOST',
        value: process.env.SMTP_HOST || '(未設定)',
        isSecret: false,
      },
      {
        key: 'SMTP_PORT',
        value: process.env.SMTP_PORT || '(未設定)',
        isSecret: false,
      },
    ];

    return NextResponse.json({ variables });
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { error: '環境変数の取得に失敗しました' },
      { status: 500 }
    );
  }
}