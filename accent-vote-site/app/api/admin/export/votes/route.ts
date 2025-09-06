import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    // 投票結果データを取得
    const votes = await prisma.vote.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        word: {
          select: {
            id: true,
            word: true,
            reading: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // データを整形
    const exportData = votes.map(vote => ({
      id: vote.id,
      userId: vote.userId,
      userEmail: vote.user?.email,
      userName: vote.user?.name,
      wordId: vote.wordId,
      word: vote.word.word,
      reading: vote.word.reading,
      selectedAccent: vote.selectedAccent,
      prefecture: vote.prefecture,
      age: vote.age,
      createdAt: vote.createdAt.toISOString(),
    }));

    // フォーマットに応じて出力
    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="votes_${Date.now()}.json"`,
        },
      });
    } else {
      // CSV形式で出力
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="votes_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting votes:', error);
    return NextResponse.json(
      { error: '投票結果のエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}