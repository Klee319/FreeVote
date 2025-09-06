import { NextRequest, NextResponse } from 'next/server';

// 設定をメモリに保存（実際のプロダクションではデータベースやRedisを使用）
let settings = {
  general: {
    siteName: 'アクセント投票サイト',
    siteDescription: '日本語アクセントの地域差を投票で収集',
    maintenanceMode: false,
    registrationEnabled: true,
  },
  rateLimit: {
    voteLimit: 100,
    voteLimitPeriod: 'hour',
    apiRateLimit: 1000,
    apiRateLimitPeriod: 'hour',
  },
  domains: {
    allowedDomains: [],
    blockedDomains: [],
    corsEnabled: true,
  },
  cache: {
    enabled: true,
    ttl: 3600,
    redisEnabled: false,
    redisUrl: '',
  },
  email: {
    provider: 'smtp',
    from: 'noreply@example.com',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { section, data } = await request.json();

    if (!section || !data) {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // セクションを更新
    (settings as any)[section] = {
      ...(settings as any)[section],
      ...data,
    };

    return NextResponse.json({
      message: '設定を更新しました',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}