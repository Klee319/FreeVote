// ランキング関連の型定義

export interface RankingItem {
  rank: number;
  wordId: number;
  headword: string;
  reading: string;
  totalVotes: number;
  uniqueVoters: number;
  // アクセント固有のフィールド（互換性のためにオプション化）
  mostVotedAccentType?: {
    id: number;
    code: string;
    name: string;
    votePercentage: number;
  };
  // 汎用的な最多投票タイプ
  mostVotedType?: {
    id: number;
    code: string;
    name: string;
    votePercentage: number;
  };
  previousRank?: number;
  rankChange?: number;
}

export interface PrefectureInfo {
  code: string;
  name: string;
  region: string;
}

export interface RankingResult {
  prefecture?: PrefectureInfo;
  period: '7d' | '30d' | 'all';
  items: RankingItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  summary: {
    totalVotes: number;
    uniqueWords: number;
    participantCount: number;
    lastUpdated: string;
  };
}

export interface ComparisonWord {
  wordId: number;
  headword: string;
  reading: string;
  rankings: Array<{
    prefectureCode: string;
    rank: number;
    voteCount: number;
    // アクセント固有（オプション）
    accentType?: string;
    // 汎用的な投票タイプ
    voteType?: string;
  }>;
}

export interface ComparisonResult {
  prefectures: PrefectureInfo[];
  comparison: {
    words: ComparisonWord[];
  };
  insights: Array<{
    type: string;
    message: string;
    data?: any;
  }>;
}

export interface RankingParams {
  prefectureCode?: string;
  period?: '7d' | '30d' | 'all';
  limit?: number;
  offset?: number;
  ageGroup?: string;
  gender?: string;
}

export type RankingTabType = 'overall' | 'age' | 'gender' | 'prefecture';

export interface RankingFilters {
  tab: RankingTabType;
  period: '7d' | '30d' | 'all';
  prefecture?: string;
  ageGroup?: string;
  gender?: string;
}

// 都道府県マスタデータ
export const PREFECTURES = [
  { code: '01', name: '北海道', region: '北海道' },
  { code: '02', name: '青森県', region: '東北' },
  { code: '03', name: '岩手県', region: '東北' },
  { code: '04', name: '宮城県', region: '東北' },
  { code: '05', name: '秋田県', region: '東北' },
  { code: '06', name: '山形県', region: '東北' },
  { code: '07', name: '福島県', region: '東北' },
  { code: '08', name: '茨城県', region: '関東' },
  { code: '09', name: '栃木県', region: '関東' },
  { code: '10', name: '群馬県', region: '関東' },
  { code: '11', name: '埼玉県', region: '関東' },
  { code: '12', name: '千葉県', region: '関東' },
  { code: '13', name: '東京都', region: '関東' },
  { code: '14', name: '神奈川県', region: '関東' },
  { code: '15', name: '新潟県', region: '中部' },
  { code: '16', name: '富山県', region: '中部' },
  { code: '17', name: '石川県', region: '中部' },
  { code: '18', name: '福井県', region: '中部' },
  { code: '19', name: '山梨県', region: '中部' },
  { code: '20', name: '長野県', region: '中部' },
  { code: '21', name: '岐阜県', region: '中部' },
  { code: '22', name: '静岡県', region: '中部' },
  { code: '23', name: '愛知県', region: '中部' },
  { code: '24', name: '三重県', region: '近畿' },
  { code: '25', name: '滋賀県', region: '近畿' },
  { code: '26', name: '京都府', region: '近畿' },
  { code: '27', name: '大阪府', region: '近畿' },
  { code: '28', name: '兵庫県', region: '近畿' },
  { code: '29', name: '奈良県', region: '近畿' },
  { code: '30', name: '和歌山県', region: '近畿' },
  { code: '31', name: '鳥取県', region: '中国' },
  { code: '32', name: '島根県', region: '中国' },
  { code: '33', name: '岡山県', region: '中国' },
  { code: '34', name: '広島県', region: '中国' },
  { code: '35', name: '山口県', region: '中国' },
  { code: '36', name: '徳島県', region: '四国' },
  { code: '37', name: '香川県', region: '四国' },
  { code: '38', name: '愛媛県', region: '四国' },
  { code: '39', name: '高知県', region: '四国' },
  { code: '40', name: '福岡県', region: '九州' },
  { code: '41', name: '佐賀県', region: '九州' },
  { code: '42', name: '長崎県', region: '九州' },
  { code: '43', name: '熊本県', region: '九州' },
  { code: '44', name: '大分県', region: '九州' },
  { code: '45', name: '宮崎県', region: '九州' },
  { code: '46', name: '鹿児島県', region: '九州' },
  { code: '47', name: '沖縄県', region: '九州' }
] as const;