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
      if (!item.title || !item.options || !Array.isArray(item.options)) {
        return NextResponse.json(
          { error: '必須フィールドが不足しています' },
          { status: 400 }
        );
      }
    }

    // 投票を一括作成
    const createPromises = data.map(item =>
      prisma.poll.create({
        data: {
          title: item.title,
          description: item.description || '',
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
          isActive: item.isActive ?? true,
          options: {
            create: item.options.map((opt: any) => ({
              text: opt.text || opt,
              voteCount: 0,
            })),
          },
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
    console.error('Error importing polls:', error);
    return NextResponse.json(
      { error: '投票データのインポートに失敗しました' },
      { status: 500 }
    );
  }
}