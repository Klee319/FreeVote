// 通常投票システムの型定義

export type PollStatus = 'draft' | 'active' | 'closed';
export type PollType = 'single' | 'multiple';
export type VoteVisibility = 'public' | 'private' | 'after_vote';

export interface Poll {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  type: PollType;
  status: PollStatus;
  voteVisibility: VoteVisibility;
  requireReason: boolean;
  allowAnonymous: boolean;
  maxChoices?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  totalVotes: number;
  uniqueVoters: number;
  options: PollOption[];
}

export interface PollOption {
  id: number;
  pollId: number;
  text: string;
  description?: string;
  displayOrder: number;
  voteCount: number;
  percentage: number;
}

export interface PollVote {
  id: number;
  pollId: number;
  optionId: number;
  userId?: string;
  deviceId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PollStatisticsData {
  totalVotes: number;
  uniqueVoters: number;
  topOption: {
    text: string;
    voteCount: number;
    percentage: number;
  };
  hourlyVotes: Array<{
    hour: string;
    count: number;
  }>;
  dailyVotes: Array<{
    date: string;
    count: number;
  }>;
}

// 人口統計データの型定義
export interface DemographicData {
  age: {
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
      optionBreakdown: Array<{
        optionId: number;
        optionText: string;
        count: number;
        percentage: number;
      }>;
    }>;
  };
  gender: {
    distribution: Array<{
      gender: 'male' | 'female' | 'other' | 'unknown';
      count: number;
      percentage: number;
      optionBreakdown: Array<{
        optionId: number;
        optionText: string;
        count: number;
        percentage: number;
      }>;
    }>;
  };
  prefecture: {
    distribution: Array<{
      prefectureCode: string;
      prefectureName: string;
      count: number;
      percentage: number;
      dominantOption: {
        optionId: number;
        optionText: string;
        percentage: number;
      };
      optionBreakdown: Array<{
        optionId: number;
        optionText: string;
        count: number;
        percentage: number;
      }>;
    }>;
  };
}

// 分析データの型定義
export interface PollAnalyticsData {
  trendData: Array<{
    timestamp: string;
    cumulativeVotes: number;
    optionTrends: Array<{
      optionId: number;
      optionText: string;
      voteCount: number;
      percentage: number;
    }>;
  }>;
  peakHours: Array<{
    hour: number;
    dayOfWeek: number;
    averageVotes: number;
  }>;
  votingVelocity: {
    current: number; // 現在の投票速度（票/時）
    average: number; // 平均投票速度
    peak: number; // ピーク時の投票速度
    peakTime: string; // ピーク時刻
  };
  projectedTotal: number; // 予測総投票数
  completionRate: number; // 投票完了率（終了日がある場合）
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  type: PollType;
  voteVisibility: VoteVisibility;
  requireReason: boolean;
  allowAnonymous: boolean;
  maxChoices?: number;
  startDate?: string;
  endDate?: string;
  options: Array<{
    text: string;
    description?: string;
  }>;
}

export interface SubmitVoteRequest {
  pollId: number;
  optionIds: number[];
  reason?: string;
  deviceId?: string;
  turnstileToken?: string;
}

export interface PollListResponse {
  polls: Poll[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface PollDetailResponse extends Poll {
  userVote?: {
    optionIds: number[];
    votedAt: string;
    reason?: string;
  };
  canVote: boolean;
}