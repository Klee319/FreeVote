// 基本的な型定義

export type AccentType = 'atamadaka' | 'heiban' | 'nakadaka' | 'odaka';

export type Prefecture = 
  | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
  | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40'
  | '41' | '42' | '43' | '44' | '45' | '46' | '47';

export type AgeGroup = '10s' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';

export type WordCategory = 'general' | 'technical' | 'dialect' | 'proper_noun';

export interface Word {
  id: number;
  headword: string;
  reading: string;
  category: WordCategory;
  moraCount: number;
  moraSegments: string[];
  totalVotes?: number;
  prefectureCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccentOption {
  id: number;
  accentTypeId: number; // accent_typeテーブルの実際のID
  accentType: {
    code: AccentType;
    name: string;
  };
  pattern: number[];
  dropPosition?: number;
}

export interface VoteData {
  wordId: number;
  accentTypeId: number;
  prefecture: Prefecture;
  ageGroup?: AgeGroup;
  deviceId?: string;
  turnstileToken?: string;
}

export interface VoteStat {
  count: number;
  percentage: number;
}

export interface AccentStat {
  accentType: AccentType;
  count: number;
  percentage: number;
  color?: string;
}

export interface PrefectureStat {
  prefectureCode: Prefecture;
  prefectureName: string;
  totalVotes: number;
  dominantAccent: AccentType;
  accentDistribution: Record<AccentType, VoteStat>;
}

export interface WordDetail extends Word {
  accentOptions: AccentOption[];
  nationalStats: AccentStat[];
  prefectureStats: PrefectureStat[];
  canVote: boolean;
  userVote?: {
    accentType: AccentType;
    votedAt: string;
  };
  aliases?: string[];
}

export interface SearchWordsQuery {
  q?: string;
  category?: WordCategory;
  sortBy?: 'popularity' | 'recent' | 'alphabetical';
  page?: number;
  limit?: number;
}

export interface SearchWordsResponse {
  words: Word[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface RankingWord extends Word {
  rank: number;
  changeFromLastWeek?: number;
  dominantAccent: AccentType;
  dominantAccentPercentage: number;
}

export interface SubmitTermData {
  term: string;
  reading: string;
  description: string;
  category: WordCategory;
  deviceId?: string;
}

export interface SubmitTermResponse {
  success: boolean;
  message: string;
  wordId?: number;
  error?: string;
}