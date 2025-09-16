import { NextRequest, NextResponse } from 'next/server';

export interface ReportRequestBody {
  wordId: number;
  reason: 'inappropriate' | 'incorrect' | 'other';
  details: string;
  deviceId?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  reportId?: number;
}

// 報告を処理するPOSTエンドポイント
export async function POST(request: NextRequest) {
  try {
    const body: ReportRequestBody = await request.json();
    
    // 必須フィールドのバリデーション
    if (!body.wordId || !body.reason) {
      return NextResponse.json(
        { 
          success: false, 
          message: '必要な情報が不足しています' 
        },
        { status: 400 }
      );
    }

    // その他の理由の場合は詳細が必須
    if (body.reason === 'other' && !body.details?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'その他を選択した場合は詳細を入力してください' 
        },
        { status: 400 }
      );
    }

    // バックエンドAPIへの転送
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3003';
    
    // Cookieヘッダーを取得
    const cookieHeader = request.headers.get('cookie');
    
    const response = await fetch(`${backendUrl}/api/words/${body.wordId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Cookieを転送
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      },
      body: JSON.stringify({
        reason: body.reason,
        details: body.details || '',
        deviceId: body.deviceId,
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          success: false,
          message: error.message || '報告の送信に失敗しました',
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // レスポンスヘッダーからSet-Cookieを取得
    const setCookieHeader = response.headers.get('set-cookie');
    
    // 成功レスポンス
    const nextResponse = NextResponse.json({
      success: true,
      message: '報告を受け付けました。ご協力ありがとうございます。',
      reportId: result.id,
    });
    
    // Set-Cookieヘッダーがあれば転送
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('Report submission error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}