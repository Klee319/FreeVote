// User types
export interface User {
  id: string;
  username?: string;
  email?: string;
  ageGroup: string;
  prefecture: string;
  gender: '男性' | '女性' | 'その他';
  referralCount: number;
  createdAt: string;
  updatedAt: string;
}

// Poll types
export interface Poll {
  id: string;
  title: string;
  description: string;
  isAccentMode: boolean;
  wordId?: number;
  options: PollOption[];
  deadline: string;
  shareMessage?: string;
  shareHashtags?: string;
  thumbnailUrl?: string;
  categories: string[];
  createdAt: string;
  totalVotes?: number;
  voteDistribution?: VoteDistribution;
}

export interface PollOption {
  label: string;
  thumbnailUrl?: string;
  pitchPattern?: number[];
  voiceSampleUrl?: string;
}

export interface VoteDistribution {
  [optionIndex: number]: number;
}

// Vote types
export interface Vote {
  pollId: string;
  option: number;
  prefecture: string;
  ageGroup?: string;
  gender?: string;
  userToken?: string;
}

// Request types
export interface UserVoteRequest {
  id: string;
  title: string;
  description: string;
  options: string[];
  count: number;
  createdAt: string;
}

// Statistics types
export interface PollStatistics {
  total: number;
  byOption: {
    [optionIndex: number]: {
      count: number;
      percentage: number;
    };
  };
  byPrefecture?: {
    [prefecture: string]: VoteDistribution;
  };
  byAge?: {
    [ageGroup: string]: VoteDistribution;
  };
  byGender?: {
    [gender: string]: VoteDistribution;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: 'success' | 'error';
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username?: string;
  ageGroup: string;
  prefecture: string;
  gender: '男性' | '女性' | 'その他';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}