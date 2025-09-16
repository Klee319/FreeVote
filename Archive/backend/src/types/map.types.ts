/**
 * Map Statistics Types
 * 地図表示用統計データの型定義
 */

/**
 * 都道府県別アクセント統計
 */
export interface PrefectureAccentStats {
  /** 都道府県コード */
  prefectureCode: string;
  /** 都道府県名 */
  prefectureName: string;
  /** 地域名 (北海道、東北、関東など) */
  region: string;
  /** 最多投票のアクセントタイプID */
  dominantAccentTypeId: number | null;
  /** 最多投票のアクセントタイプ名 */
  dominantAccentTypeName: string | null;
  /** 総投票数 */
  totalVotes: number;
  /** データ充足フラグ (投票数が10以上の場合true) */
  hasEnoughData: boolean;
  /** アクセントタイプ別分布 */
  distribution: AccentDistribution[];
}

/**
 * アクセント分布詳細
 */
export interface AccentDistribution {
  /** アクセントタイプID */
  accentTypeId: number;
  /** アクセントタイプ名 */
  accentTypeName: string;
  /** 投票数 */
  voteCount: number;
  /** 割合 (%) */
  percentage: number;
}

/**
 * 語の地図統計レスポンス
 */
export interface WordMapStatsResponse {
  /** 語ID */
  wordId: number;
  /** 見出し語 */
  headword: string;
  /** 読み */
  reading: string;
  /** カテゴリ情報 */
  category: {
    id: number;
    name: string;
  };
  /** 都道府県別統計 */
  prefectureStats: PrefectureAccentStats[];
  /** 全国統計サマリ */
  nationalSummary: {
    totalVotes: number;
    dominantAccentTypeId: number | null;
    dominantAccentTypeName: string | null;
    distribution: AccentDistribution[];
  };
}

/**
 * 都道府県別全語統計レスポンス
 */
export interface PrefectureAllWordsStatsResponse {
  /** 都道府県コード */
  prefectureCode: string;
  /** 都道府県名 */
  prefectureName: string;
  /** 地域名 */
  region: string;
  /** 総投票数 */
  totalVotes: number;
  /** アクセントタイプ別傾向 */
  accentTrends: {
    accentTypeId: number;
    accentTypeName: string;
    voteCount: number;
    percentage: number;
    wordCount: number; // そのアクセントタイプを選んだ語の数
  }[];
  /** 人気の語トップ10 */
  topWords: {
    wordId: number;
    headword: string;
    reading: string;
    voteCount: number;
    dominantAccentTypeId: number;
    dominantAccentTypeName: string;
  }[];
}

/**
 * 全国概要統計レスポンス
 */
export interface MapOverviewStatsResponse {
  /** データ更新日時 */
  lastUpdated: Date;
  /** 全体統計 */
  summary: {
    totalWords: number;
    totalVotes: number;
    totalPrefectures: number;
    prefecturesWithData: number;
  };
  /** 地域別アクセント傾向 */
  regionalTrends: {
    region: string;
    totalVotes: number;
    dominantAccentTypeId: number | null;
    dominantAccentTypeName: string | null;
    prefectures: string[];
  }[];
  /** 全国で最も投票の多い語 */
  mostVotedWords: {
    wordId: number;
    headword: string;
    reading: string;
    totalVotes: number;
  }[];
}

/**
 * 地域クラスター分析結果
 */
export interface AccentClusterAnalysis {
  /** 語ID */
  wordId: number;
  /** クラスター */
  clusters: {
    /** クラスター名 (類似地域グループ) */
    name: string;
    /** 主要アクセントタイプ */
    dominantAccentTypeId: number;
    dominantAccentTypeName: string;
    /** 含まれる都道府県 */
    prefectures: {
      code: string;
      name: string;
      similarity: number; // 0-1の類似度スコア
    }[];
  }[];
  /** 地域間の境界線 (アクセントの変化が大きい地域) */
  boundaries: {
    prefecture1: string;
    prefecture2: string;
    difference: number; // 差異の大きさ
  }[];
}