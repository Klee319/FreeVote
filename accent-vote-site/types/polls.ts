/**
 * 通常投票システムの型定義
 */

import { Prefecture, AgeGroup } from './index';

// 投票ステータス
export type PollStatus = 'draft' | 'active' | 'ended';

// 投票タイプ
export type PollType = 'single' | 'multiple';

// 投票カテゴリ
export type PollCategory = 
  | 'general'      // 一般
  | 'tech'         // 技術
  | 'culture'      // 文化
  | 'lifestyle'    // ライフスタイル
  | 'entertainment' // エンタメ
  | 'education'    // 教育
  | 'business'     // ビジネス
  | 'other';       // その他

// 投票選択肢
export interface PollOption {
  id: number;
  text: string;
  description?: string;
  order: number;
  voteCount?: number;
  percentage?: number;
}

// 投票基本情報
export interface Poll {
  id: number;
  title: string;
  description?: string;
  category: PollCategory;
  type: PollType;
  status: PollStatus;
  thumbnailUrl?: string;
  startDate: string;
  endDate?: string;
  totalVotes: number;
  uniqueVoters: number;
  optionCount: number;
  allowAnonymous: boolean;
  requireReason?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

// 投票詳細情報
export interface PollDetail extends Poll {
  options: PollOption[];
  canVote: boolean;
  hasVoted: boolean;
  userVote?: {
    optionIds: number[];
    reason?: string;
    votedAt: string;
  };
  tags?: string[];
  relatedPolls?: Poll[];
}

// 投票データ
export interface PollVote {
  pollId: number;
  optionIds: number[];
  reason?: string;
  prefecture?: Prefecture;
  ageGroup?: AgeGroup;
  deviceId?: string;
  turnstileToken?: string;
}

// 投票結果統計
export interface PollResults {
  pollId: number;
  totalVotes: number;
  uniqueVoters: number;
  options: PollOptionResult[];
  demographics?: {
    byAge: Record<AgeGroup, number>;
    byPrefecture: Record<Prefecture, number>;
    byGender?: Record<string, number>;
  };
  votingTrends?: {
    hourly: Array<{ hour: number; votes: number }>;
    daily: Array<{ date: string; votes: number }>;
  };
}

// 選択肢ごとの結果
export interface PollOptionResult extends PollOption {
  voteCount: number;
  percentage: number;
  demographics?: {
    byAge: Record<AgeGroup, number>;
    byPrefecture: Record<Prefecture, number>;
  };
}

// 投票検索クエリ
export interface PollsQuery {
  q?: string;
  category?: PollCategory;
  status?: PollStatus;
  sort?: 'popular' | 'recent' | 'ending_soon';
  page?: number;
  limit?: number;
}

// 投票検索レスポンス
export interface PollsResponse {
  polls: Poll[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// 投票作成データ
export interface CreatePollData {
  title: string;
  description?: string;
  category: PollCategory;
  type: PollType;
  options: Array<{
    text: string;
    description?: string;
  }>;
  startDate: string;
  endDate?: string;
  allowAnonymous: boolean;
  requireReason?: boolean;
  tags?: string[];
}

// 投票更新データ
export interface UpdatePollData extends Partial<CreatePollData> {
  status?: PollStatus;
}

// 結果表示クエリ
export interface ResultsQuery {
  view?: 'chart' | 'demographics' | 'geographic' | 'trends';
  breakdown?: 'age' | 'prefecture' | 'gender';
}

// チャートタイプ
export type ChartType = 'bar' | 'pie' | 'donut' | 'horizontal-bar' | 'auto';

// ビュー設定
export interface ViewPreferences {
  cardSize: 'sm' | 'md' | 'lg';
  chartType: ChartType;
  showDetails: boolean;
}

// フィルター設定
export interface PollFilters {
  status: PollStatus[];
  category: PollCategory[];
  sortBy: 'popular' | 'recent' | 'ending_soon';
}