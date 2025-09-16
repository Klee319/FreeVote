// アプリケーション設定の型定義

export interface DisplaySettings {
  itemsPerPage: number;
  maxRecentWords: number;
  maxRankingItems: number;
  maxRelatedWords: number;
  maxSearchResults: number;
  animationDuration: number;
  debounceDelay: number;
}

export interface ChartSettings {
  defaultBarHeight: number;
  maxBarWidth: number;
  chartColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  showPercentageThreshold: number;
}

export interface MapSettings {
  defaultZoomLevel: number;
  minZoomLevel: number;
  maxZoomLevel: number;
  defaultSelectedPrefecture: string;
  enableAnimation: boolean;
  tooltipDelay: number;
}

export interface VoteSettings {
  minVotesToShowStats: number;
  voteTimeout: number;
  enableAnonymousVoting: boolean;
  requireEmailVerification: boolean;
  maxVotesPerDay: number;
}

export interface FeatureFlags {
  enableMap: boolean;
  enableRanking: boolean;
  enableBookmarks: boolean;
  enableExport: boolean;
  enableReport: boolean;
  enableShare: boolean;
  maintenanceMode: boolean;
}

export interface AppSettings {
  display: DisplaySettings;
  chart: ChartSettings;
  map: MapSettings;
  vote: VoteSettings;
  features: FeatureFlags;
  lastUpdated: string;
}

// デフォルト設定値（APIからの取得に失敗した場合のフォールバック）
export const DEFAULT_APP_SETTINGS: AppSettings = {
  display: {
    itemsPerPage: 20,
    maxRecentWords: 10,
    maxRankingItems: 50,
    maxRelatedWords: 8,
    maxSearchResults: 100,
    animationDuration: 300,
    debounceDelay: 500,
  },
  chart: {
    defaultBarHeight: 24,
    maxBarWidth: 100,
    chartColors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      quaternary: '#ef4444',
    },
    showPercentageThreshold: 1,
  },
  map: {
    defaultZoomLevel: 1,
    minZoomLevel: 0.5,
    maxZoomLevel: 3,
    defaultSelectedPrefecture: '13',
    enableAnimation: true,
    tooltipDelay: 200,
  },
  vote: {
    minVotesToShowStats: 5,
    voteTimeout: 5000,
    enableAnonymousVoting: true,
    requireEmailVerification: false,
    maxVotesPerDay: 100,
  },
  features: {
    enableMap: true,
    enableRanking: true,
    enableBookmarks: true,
    enableExport: true,
    enableReport: true,
    enableShare: true,
    maintenanceMode: false,
  },
  lastUpdated: new Date().toISOString(),
};