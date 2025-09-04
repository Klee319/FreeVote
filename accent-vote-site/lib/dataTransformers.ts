import { AccentStat, PrefectureStat, AccentType, VoteStat } from '@/types';

/**
 * APIレスポンスのアクセント統計データを正規化
 */
export function normalizeAccentStats(stats: any[]): AccentStat[] {
  if (!stats || !Array.isArray(stats)) return [];
  
  const totalVotes = stats.reduce((sum, stat) => 
    sum + (stat.voteCount || stat.count || 0), 0
  );
  
  return stats.map(stat => ({
    // accentTypeがオブジェクトの場合はcodeプロパティを抽出
    accentType: typeof stat.accentType === 'object' && stat.accentType !== null
      ? stat.accentType.code 
      : stat.accentType,
    count: stat.voteCount || stat.count || 0,
    percentage: totalVotes > 0 
      ? ((stat.voteCount || stat.count || 0) / totalVotes) * 100 
      : 0
  }));
}

/**
 * APIレスポンスの都道府県統計データを正規化
 */
export function normalizePrefectureStats(stats: any[]): PrefectureStat[] {
  if (!stats || !Array.isArray(stats)) return [];
  
  return stats.map(stat => {
    const totalVotes = stat.totalVotes || 0;
    const distribution: Record<AccentType, VoteStat> = {} as Record<AccentType, VoteStat>;
    
    // accentDistributionが存在しない場合の対処
    if (stat.accentDistribution && typeof stat.accentDistribution === 'object') {
      Object.entries(stat.accentDistribution).forEach(([type, voteStat]: [string, any]) => {
        distribution[type as AccentType] = {
          count: voteStat?.count || 0,
          percentage: totalVotes > 0 && voteStat?.count
            ? (voteStat.count / totalVotes) * 100 
            : 0
        };
      });
    }
    
    return {
      prefectureCode: stat.prefectureCode,
      prefectureName: stat.prefectureName || '',
      totalVotes,
      dominantAccent: stat.dominantAccent || 'heiban',
      accentDistribution: distribution
    };
  });
}

/**
 * 投票APIレスポンスの統計データを正規化
 */
export function normalizeVoteResponseStats(response: any): {
  national: AccentStat[];
  prefecture?: PrefectureStat[];
} {
  const result: { national: AccentStat[]; prefecture?: PrefectureStat[] } = {
    national: []
  };

  // nationalデータの正規化
  if (response?.stats?.national) {
    result.national = normalizeAccentStats(response.stats.national);
  } else if (response?.statistics?.national) {
    result.national = normalizeAccentStats(response.statistics.national);
  }

  // prefectureデータの正規化（存在する場合）
  if (response?.stats?.prefecture) {
    result.prefecture = normalizePrefectureStats(response.stats.prefecture);
  } else if (response?.statistics?.prefecture) {
    result.prefecture = normalizePrefectureStats(response.statistics.prefecture);
  }

  return result;
}

/**
 * パーセンテージを安全に取得
 */
export function safePercentage(value: number | undefined | null, total: number): number {
  if (value == null || total <= 0) return 0;
  return (value / total) * 100;
}

/**
 * 数値を安全にフォーマット
 */
export function safeToFixed(value: number | undefined | null, decimals: number = 1): string {
  if (value == null || isNaN(value)) return '0';
  return value.toFixed(decimals);
}