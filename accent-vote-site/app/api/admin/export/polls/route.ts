import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    // 投票データを取得
    const polls = await prisma.poll.findMany({
      include: {
        options: true,
        _count: {
          select: {
            pollVotes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // データを整形
    const exportData = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      startDate: poll.startDate?.toISOString(),
      endDate: poll.endDate?.toISOString(),
      isActive: poll.isActive,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.voteCount,
      })),
      totalVotes: poll._count.pollVotes,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    }));

    // フォーマットに応じて出力
    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="polls_${Date.now()}.json"`,
        },
      });
    } else {
      // CSV形式で出力（フラット化）
      const flatData = exportData.map(poll => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        startDate: poll.startDate,
        endDate: poll.endDate,
        isActive: poll.isActive,
        optionsCount: poll.options.length,
        totalVotes: poll.totalVotes,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
      }));

      const csv = Papa.unparse(flatData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="polls_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting polls:', error);
    return NextResponse.json(
      { error: '投票データのエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}