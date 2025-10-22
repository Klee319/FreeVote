/**
 * 投票選択肢の型定義
 */
export interface PollOption {
  label: string;
  thumbnailUrl?: string;
  pitchPattern?: number[];
  voiceSampleUrl?: string;
}

/**
 * 各選択肢の投票数情報
 */
export interface VoteCount {
  option: number;
  count: number;
  percentage: number;
}

/**
 * OGP等のシェア用メタデータ
 */
export interface ShareMetadata {
  title: string;
  description: string;
  options: PollOption[];
  categories: string[];
  totalVotes: number;
  commentCount: number;
  thumbnailUrl: string | null;
  deadline: Date | null;
  voteCounts: VoteCount[];
}
