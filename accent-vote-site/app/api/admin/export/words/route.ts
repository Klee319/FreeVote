import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    // 単語データを取得
    const words = await prisma.word.findMany({
      include: {
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // データを整形
    const exportData = words.map(word => ({
      id: word.id,
      word: word.word,
      reading: word.reading,
      description: word.description,
      accentType: word.accentType,
      voteCount: word._count.votes,
      createdAt: word.createdAt.toISOString(),
      updatedAt: word.updatedAt.toISOString(),
    }));

    // フォーマットに応じて出力
    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="words_${Date.now()}.json"`,
        },
      });
    } else {
      // CSV形式で出力
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="words_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting words:', error);
    return NextResponse.json(
      { error: '単語データのエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}