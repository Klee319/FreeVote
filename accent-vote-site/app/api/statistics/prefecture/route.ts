import { NextRequest, NextResponse } from 'next/server';
import { prefectures } from '@/lib/japanMapData';

// 都道府県別の投票データ（モックデータ）
// 本番環境ではデータベースから取得する
export async function GET(request: NextRequest) {
  try {
    // モックデータを生成
    const mockData = prefectures.map((prefecture) => {
      // 各都道府県に対してランダムなアクセントタイプ分布を生成
      const accentTypes = ['頭高型', '平板型', '中高型', '尾高型'];
      const totalVotes = Math.floor(Math.random() * 1000) + 100; // 100〜1100の間でランダム
      
      // ランダムな分布を生成
      const distribution = accentTypes.map((type) => Math.random());
      const sum = distribution.reduce((a, b) => a + b, 0);
      const normalized = distribution.map((d) => d / sum);
      
      const votes = accentTypes.map((type, index) => ({
        accentType: type,
        count: Math.floor(normalized[index] * totalVotes),
        percentage: normalized[index] * 100
      }));
      
      // 合計が正確にtotalVotesになるように調整
      const actualTotal = votes.reduce((sum, v) => sum + v.count, 0);
      if (actualTotal < totalVotes) {
        votes[0].count += totalVotes - actualTotal;
      }
      
      // パーセンテージを再計算
      votes.forEach((v) => {
        v.percentage = (v.count / totalVotes) * 100;
      });
      
      return {
        prefecture: prefecture.name,
        votes: votes.sort((a, b) => b.count - a.count), // 投票数で降順ソート
        totalVotes
      };
    });
    
    // 一部の都道府県をデータ不足にする（よりリアルなデモのため）
    const dataLessPrefectures = ['鳥取県', '島根県', '高知県', '佐賀県', '山梨県'];
    mockData.forEach((data) => {
      if (dataLessPrefectures.includes(data.prefecture)) {
        data.votes = [];
        data.totalVotes = 0;
      }
    });
    
    return NextResponse.json(mockData, { status: 200 });
  } catch (error) {
    console.error('Error generating mock prefecture data:', error);
    return NextResponse.json(
      { error: 'Failed to generate prefecture statistics' },
      { status: 500 }
    );
  }
}

// 実際のデータベース実装の例（コメントアウト）
/*
export async function GET(request: NextRequest) {
  try {
    // データベースから都道府県別の投票データを取得
    const db = await getDb();
    const query = `
      SELECT 
        u.prefecture,
        v.accent_type_id,
        at.name as accent_type,
        COUNT(*) as count
      FROM votes v
      INNER JOIN users u ON v.user_id = u.id
      INNER JOIN accent_types at ON v.accent_type_id = at.id
      WHERE u.prefecture IS NOT NULL
      GROUP BY u.prefecture, v.accent_type_id, at.name
      ORDER BY u.prefecture, count DESC
    `;
    
    const results = await db.all(query);
    
    // 都道府県ごとにグループ化
    const prefectureData = new Map();
    results.forEach((row) => {
      if (!prefectureData.has(row.prefecture)) {
        prefectureData.set(row.prefecture, {
          prefecture: row.prefecture,
          votes: [],
          totalVotes: 0
        });
      }
      
      const data = prefectureData.get(row.prefecture);
      data.votes.push({
        accentType: row.accent_type,
        count: row.count,
        percentage: 0 // 後で計算
      });
      data.totalVotes += row.count;
    });
    
    // パーセンテージを計算
    prefectureData.forEach((data) => {
      data.votes.forEach((vote) => {
        vote.percentage = (vote.count / data.totalVotes) * 100;
      });
    });
    
    return NextResponse.json(Array.from(prefectureData.values()), { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prefecture statistics' },
      { status: 500 }
    );
  }
}
*/