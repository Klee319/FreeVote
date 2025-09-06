import { NextRequest, NextResponse } from 'next/server';

// メモリ内で認証設定を管理（実際のプロダクションではデータベースを使用）
let authSettings = {
  requireEmailVerification: true,
  sessionTimeout: 3600,
  maxLoginAttempts: 5,
  lockoutDuration: 900,
  twoFactorEnabled: false,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ settings: authSettings });
  } catch (error) {
    console.error('Error fetching auth settings:', error);
    return NextResponse.json(
      { error: '認証設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newSettings = await request.json();

    authSettings = {
      ...authSettings,
      ...newSettings,
    };

    return NextResponse.json({
      message: '認証設定を更新しました',
      settings: authSettings,
    });
  } catch (error) {
    console.error('Error updating auth settings:', error);
    return NextResponse.json(
      { error: '認証設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}