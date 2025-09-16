import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // 開発環境用のモックデータ
    const mockPolls = [
      {
        id: 1,
        title: '「寿司」のアクセントはどこが正しい？',
        description: '関東と関西で異なる「寿司」のアクセントについて皆さんの意見を聞かせてください',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
        voteCount: 234,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間後
      },
      {
        id: 2,
        title: '「桜」の読み方アクセント調査',
        description: '春の代表的な花「桜」のアクセントパターンを調査しています',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5時間前
        voteCount: 156,
      },
      {
        id: 3,
        title: '「富士山」のアクセントはどっち？',
        description: '日本の象徴「富士山」のアクセントについて投票をお願いします',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1日前
        voteCount: 89,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日後
      },
      {
        id: 4,
        title: '「東京」のアクセント地域差調査',
        description: '首都「東京」のアクセントの地域による違いを調査中',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2日前
        voteCount: 312,
      },
      {
        id: 5,
        title: '「花見」の季節感とアクセント',
        description: '春の文化「花見」のアクセントパターンについて',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前
        voteCount: 78,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5日後
      },
    ];

    // 作成日でソートして制限数まで返す
    const sortedPolls = mockPolls
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: sortedPolls,
    });
  } catch (error) {
    console.error('[API] Recent polls error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '新着投票の取得に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}