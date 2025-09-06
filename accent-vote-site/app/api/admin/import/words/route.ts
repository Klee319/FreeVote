import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'データは配列形式である必要があります' },
        { status: 400 }
      );
    }

    // データ検証
    for (const item of data) {
      if (!item.word || !item.accentType) {
        return NextResponse.json(
          { error: '必須フィールドが不足しています' },
          { status: 400 }
        );
      }
    }

    // 単語を一括作成
    const createPromises = data.map(item =>
      prisma.word.create({
        data: {
          word: item.word,
          reading: item.reading || '',
          description: item.description || '',
          accentType: item.accentType,
        },
      })
    );

    const results = await Promise.allSettled(createPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: 'インポートが完了しました',
      count: successCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error('Error importing words:', error);
    return NextResponse.json(
      { error: '単語データのインポートに失敗しました' },
      { status: 500 }
    );
  }
}