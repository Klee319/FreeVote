# API詳細設計書

## 1. API設計概要

### 1.1 設計原則
- **RESTful設計**: HTTPメソッドとステータスコードの適切な使用
- **一貫性**: 統一されたレスポンス形式とエラーハンドリング
- **セキュリティ**: JWT認証とレート制限による保護
- **バリデーション**: 厳密な入力検証とサニタイゼーション
- **ドキュメント**: OpenAPI 3.0準拠の詳細仕様

### 1.2 ベースURL構成
```
開発環境: http://localhost:3001/api
本番環境: https://api.vote-site.com/api
```

### 1.3 共通仕様

#### 共通リクエストヘッダー
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  # 認証が必要な場合
User-Agent: VoteSite/1.0
X-Request-ID: <UUID>              # リクエスト追跡用
```

#### 共通レスポンス形式
```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationInfo;
  };
}

// エラーレスポンス
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // 開発環境のみ
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// ページネーション情報
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

## 2. 認証API

### 2.1 POST /api/auth/register
ユーザー新規登録

#### リクエスト
```typescript
interface RegisterRequest {
  // メール登録の場合
  email: string;                    // 255文字以内、メール形式
  password: string;                 // 8-100文字、英数字混在
  // SNS登録の場合
  provider?: 'twitter' | 'instagram' | 'tiktok';
  providerId?: string;              // 外部サービスID
  externalToken?: string;           // 外部認証トークン
  // 共通フィールド
  username?: string;                // 50文字以内、英数字のみ
  ageGroup: '10代' | '20代' | '30代' | '40代' | '50代' | '60代以上';
  prefecture: string;               // 都道府県コード
  gender: 'male' | 'female' | 'other';
}
```

#### レスポンス
```typescript
interface RegisterResponse {
  user: {
    id: string;
    username: string | null;
    email: string | null;
    ageGroup: string;
    prefecture: string;
    gender: string;
    provider: string | null;
    referralCount: number;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;              // 秒
  };
}
```

#### バリデーション
```typescript
const registerSchema = z.object({
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).max(100).regex(/^(?=.*[A-Za-z])(?=.*\d)/).optional(),
  provider: z.enum(['twitter', 'instagram', 'tiktok']).optional(),
  providerId: z.string().max(100).optional(),
  externalToken: z.string().optional(),
  username: z.string().max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  ageGroup: z.enum(['10代', '20代', '30代', '40代', '50代', '60代以上']),
  prefecture: z.string().length(2),
  gender: z.enum(['male', 'female', 'other'])
}).refine(data => {
  // メール登録かSNS登録のいずれかが必須
  return (data.email && data.password) || (data.provider && data.providerId && data.externalToken);
});
```

#### エラーレスポンス
```typescript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが不正です",
    "details": {
      "email": ["有効なメールアドレスを入力してください"],
      "password": ["パスワードは8文字以上で英数字を含む必要があります"]
    }
  }
}

// 409 Conflict
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "このメールアドレスは既に登録されています"
  }
}
```

### 2.2 POST /api/auth/login
ユーザーログイン

#### リクエスト
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

#### レスポンス
```typescript
interface LoginResponse {
  user: UserInfo;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

### 2.3 POST /api/auth/social-login
SNSログイン

#### リクエスト
```typescript
interface SocialLoginRequest {
  provider: 'twitter' | 'instagram' | 'tiktok';
  externalToken: string;
  providerId?: string;              // 初回登録時に必要
}
```

### 2.4 POST /api/auth/refresh
トークンリフレッシュ

#### リクエスト
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

#### レスポンス
```typescript
interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
```

### 2.5 POST /api/auth/logout
ログアウト

#### リクエスト
```typescript
interface LogoutRequest {
  refreshToken?: string;            // 全デバイスからログアウト
}
```

### 2.6 GET /api/auth/me
ユーザー情報取得

#### レスポンス
```typescript
interface UserInfo {
  id: string;
  username: string | null;
  email: string | null;
  ageGroup: string;
  prefecture: string;
  gender: string;
  provider: string | null;
  referralCount: number;
  rankBadge: string;                // 紹介ランクバッジ
  createdAt: string;
}
```

## 3. 投票API

### 3.1 GET /api/polls
投票一覧取得

#### クエリパラメータ
```typescript
interface PollsQuery {
  category?: string;                // カテゴリフィルター
  sort?: 'new' | 'trending' | 'voteCount' | 'deadline';
  search?: string;                  // キーワード検索
  page?: number;                    // ページ番号（1から開始）
  limit?: number;                   // 1ページあたりの件数（最大100）
  isActive?: boolean;               // アクティブな投票のみ
  includeExpired?: boolean;         // 期限切れ投票を含む
}
```

#### レスポンス
```typescript
interface PollsResponse {
  polls: Array<{
    id: string;
    title: string;
    description: string;
    isAccentMode: boolean;
    thumbnailUrl: string | null;
    categories: string[];
    deadline: string;
    voteCount: number;
    trendingScore: number;          // 急上昇スコア
    previewResults?: {              // 投票済みの場合のみ
      totalVotes: number;
      userChoice: number;
      quickStats: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
    };
    createdAt: string;
  }>;
  pagination: PaginationInfo;
  filters: {
    availableCategories: string[];
    totalActivePolls: number;
  };
}
```

#### ソートアルゴリズム
```typescript
// trending スコア計算式
const calculateTrendingScore = (poll: Poll, votes: PollVote[]) => {
  const now = new Date();
  const hoursOld = (now.getTime() - poll.createdAt.getTime()) / (1000 * 60 * 60);
  const recentVotes = votes.filter(vote =>
    (now.getTime() - vote.votedAt.getTime()) < (24 * 60 * 60 * 1000)
  ).length;

  return recentVotes / Math.max(hoursOld, 1) * 100;
};
```

### 3.2 GET /api/polls/:id
投票詳細取得

#### レスポンス
```typescript
interface PollDetailResponse {
  poll: {
    id: string;
    title: string;
    description: string;
    isAccentMode: boolean;
    wordId: number | null;
    options: Array<{
      index: number;
      label: string;
      thumbnailUrl: string | null;
      pitchPattern?: number[];      // アクセントモード時のみ
      voiceSampleUrl?: string;      // アクセントモード時のみ
    }>;
    deadline: string;
    shareMessage: string | null;
    shareHashtags: string | null;
    thumbnailUrl: string | null;
    categories: string[];
    createdAt: string;
    createdBy: string;

    // 投票統計（投票済みユーザーのみ）
    results?: {
      totalVotes: number;
      userVote: {
        option: number;
        votedAt: string;
      } | null;
      distribution: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
      isCloseRace: boolean;         // 接戦判定
      topOption: number;
      margin: number;               // 1位と2位の得票率差
    };

    // 地図データ（登録ユーザーのみ）
    mapData?: Array<{
      prefecture: string;
      topOption: number;
      voteCount: number;
    }>;

    // 関連情報
    relatedPolls: Array<{
      id: string;
      title: string;
      thumbnailUrl: string | null;
    }>;
  };

  // 投票可否情報
  canVote: boolean;
  voteRestriction?: {
    reason: 'already_voted' | 'expired' | 'not_active';
    message: string;
  };
}
```

### 3.3 POST /api/polls/:id/votes
投票実行

#### リクエスト
```typescript
interface VoteRequest {
  option: number;                   // 0-3
  prefecture: string;               // 必須（ゲストユーザー）
  ageGroup?: string;                // 必須（ゲストユーザー）
  gender?: string;                  // 必須（ゲストユーザー）
  userToken?: string;               // 2回目以降必須
}
```

#### レスポンス
```typescript
interface VoteResponse {
  userToken?: string;               // 初回投票時のみ生成
  results: {
    totalVotes: number;
    distribution: Array<{
      option: number;
      count: number;
      percentage: number;
    }>;
    userVote: {
      option: number;
      votedAt: string;
    };
    ranking: Array<{
      option: number;
      rank: number;
    }>;
  };
  shareData: {
    message: string;
    hashtags: string[];
    url: string;
  };
}
```

#### バリデーション
```typescript
const voteSchema = z.object({
  option: z.number().int().min(0).max(3),
  prefecture: z.string().length(2),
  ageGroup: z.enum(['10代', '20代', '30代', '40代', '50代', '60代以上']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  userToken: z.string().max(100).optional()
});
```

### 3.4 GET /api/polls/:id/stats
詳細統計取得（登録ユーザーのみ）

#### クエリパラメータ
```typescript
interface StatsQuery {
  filterBy?: 'age' | 'gender' | 'prefecture';
  breakdown?: boolean;              // 詳細内訳を含む
}
```

#### レスポンス
```typescript
interface StatsResponse {
  overview: {
    totalVotes: number;
    uniquePrefectures: number;
    averageVotesPerPrefecture: number;
    mostActiveHour: number;
    peakVotingDate: string;
  };

  distribution: Array<{
    option: number;
    count: number;
    percentage: number;
    rank: number;
  }>;

  breakdown?: {
    byAge?: Array<{
      ageGroup: string;
      totalVotes: number;
      distribution: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
    }>;

    byGender?: Array<{
      gender: string;
      totalVotes: number;
      distribution: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
    }>;

    byPrefecture?: Array<{
      prefecture: string;
      prefectureName: string;
      totalVotes: number;
      topOption: number;
      distribution: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
    }>;
  };

  trends: {
    hourlyVotes: Array<{
      hour: number;
      count: number;
    }>;
    dailyVotes: Array<{
      date: string;
      count: number;
    }>;
  };
}
```

### 3.5 GET /api/polls/:id/map-data
地図表示用データ取得

#### レスポンス
```typescript
interface MapDataResponse {
  mapData: Array<{
    prefecture: string;
    prefectureName: string;
    topOption: number;
    topOptionLabel: string;
    voteCount: number;
    distribution: Array<{
      option: number;
      count: number;
      percentage: number;
    }>;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;

  legend: Array<{
    option: number;
    label: string;
    color: string;
    count: number;
    prefectureCount: number;
  }>;

  statistics: {
    totalPrefectures: number;
    mostVotedPrefecture: string;
    leastVotedPrefecture: string;
    averageVotesPerPrefecture: number;
  };
}
```

### 3.6 GET /api/polls/:id/share-message
シェアメッセージ生成

#### クエリパラメータ
```typescript
interface ShareMessageQuery {
  option: number;                   // ユーザーが選択した選択肢
  platform?: 'twitter' | 'instagram' | 'tiktok';
}
```

#### レスポンス
```typescript
interface ShareMessageResponse {
  message: string;
  hashtags: string[];
  url: string;
  platform: string;

  // コンテキスト情報
  context: {
    isCloseRace: boolean;
    userOptionRank: number;
    margin: number;
    totalVotes: number;
  };

  // プラットフォーム別設定
  platformConfig: {
    maxLength: number;
    recommendedHashtags: string[];
    imageUrl?: string;              // Instagram/TikTok用
  };
}
```

#### メッセージ生成ロジック
```typescript
const generateShareMessage = (poll: Poll, userOption: number, stats: any) => {
  const { isCloseRace, userOptionRank, margin } = stats;

  if (isCloseRace && userOptionRank === 1) {
    return `「${poll.title}」で私が選んだ「${poll.options[userOption].label}」が僅差でリード中！🔥 油断すると逆転されるかも？`;
  } else if (isCloseRace && userOptionRank === 2) {
    return `「${poll.title}」で私は「${poll.options[userOption].label}」に投票！あと${margin.toFixed(1)}%で逆転です🚀`;
  } else {
    return `「${poll.title}」で私は「${poll.options[userOption].label}」に投票しました！みんなも参加してね✨`;
  }
};
```

## 4. 管理API

### 4.1 POST /api/admin/polls
投票作成（管理者のみ）

#### リクエスト
```typescript
interface CreatePollRequest {
  title: string;                    // 200文字以内
  description: string;              // 2000文字以内
  isAccentMode: boolean;
  wordId?: number;                  // アクセントモード時のみ
  options: Array<{
    label: string;                  // 100文字以内
    thumbnailUrl?: string;
    pitchPattern?: number[];        // アクセントモード時のみ
  }>;
  deadline: string;                 // ISO 8601形式
  categories: string[];             // 最大5個
  shareMessage?: string;            // 280文字以内
  shareHashtags?: string;           // カンマ区切り
  thumbnailUrl?: string;
}
```

#### バリデーション
```typescript
const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  isAccentMode: z.boolean(),
  wordId: z.number().int().positive().optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(100),
    thumbnailUrl: z.string().url().optional(),
    pitchPattern: z.array(z.number().int().min(0).max(2)).optional()
  })).min(2).max(4),
  deadline: z.string().datetime(),
  categories: z.array(z.string().max(50)).max(5),
  shareMessage: z.string().max(280).optional(),
  shareHashtags: z.string().max(200).optional(),
  thumbnailUrl: z.string().url().optional()
}).refine(data => {
  // アクセントモードの場合はwordIdが必須
  if (data.isAccentMode && !data.wordId) {
    return false;
  }
  // 締切は未来の日時である必要がある
  return new Date(data.deadline) > new Date();
});
```

### 4.2 PUT /api/admin/polls/:id
投票更新（管理者のみ）

#### リクエスト
```typescript
interface UpdatePollRequest {
  title?: string;
  description?: string;
  deadline?: string;                // 投票開始後は延長のみ可能
  categories?: string[];
  shareMessage?: string;
  shareHashtags?: string;
  isActive?: boolean;               // 無効化のみ可能
}
```

### 4.3 DELETE /api/admin/polls/:id
投票削除（管理者のみ）

#### レスポンス
```typescript
interface DeletePollResponse {
  message: string;
  deletedAt: string;
  affectedVotes: number;            // 削除される投票数
}
```

### 4.4 GET /api/admin/dashboard
管理ダッシュボード情報取得

#### レスポンス
```typescript
interface AdminDashboardResponse {
  summary: {
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    totalUsers: number;
    todayVotes: number;
    pendingRequests: number;
  };

  recentPolls: Array<{
    id: string;
    title: string;
    voteCount: number;
    createdAt: string;
    deadline: string;
    isActive: boolean;
  }>;

  trendingPolls: Array<{
    id: string;
    title: string;
    trendingScore: number;
    voteCount: number;
  }>;

  systemStats: {
    serverStatus: 'healthy' | 'warning' | 'error';
    databaseConnections: number;
    averageResponseTime: number;
    errorRate: number;
  };
}
```

## 5. 提案・リクエストAPI

### 5.1 POST /api/requests
投票提案作成

#### リクエスト
```typescript
interface CreateRequestRequest {
  title: string;                    // 200文字以内
  description: string;              // 2000文字以内
  options: Array<{
    label: string;                  // 100文字以内
  }>;                              // 2-4個
  categories?: string[];            // 最大3個
}
```

### 5.2 GET /api/requests
提案一覧取得

#### クエリパラメータ
```typescript
interface RequestsQuery {
  status?: 'pending' | 'approved' | 'rejected';
  sort?: 'latest' | 'popular' | 'oldest';
  page?: number;
  limit?: number;
}
```

### 5.3 POST /api/requests/:id/like
提案への「いいね」

#### レスポンス
```typescript
interface LikeRequestResponse {
  likeCount: number;
  userLiked: boolean;
}
```

### 5.4 PUT /api/admin/requests/:id
提案の承認・却下（管理者のみ）

#### リクエスト
```typescript
interface UpdateRequestRequest {
  status: 'approved' | 'rejected';
  adminComment?: string;            // 却下理由等
}
```

## 6. 紹介・シェアAPI

### 6.1 POST /api/referrals/visit
シェアリンク経由の訪問記録

#### リクエスト
```typescript
interface ReferralVisitRequest {
  sharedBy: string;                 // シェアしたユーザーID
  pollId: string;                   // 投票ID
  visitorToken: string;             // 訪問者識別トークン
  platform?: string;               // 流入元プラットフォーム
}
```

### 6.2 GET /api/users/:id/referrals
ユーザーの紹介統計取得

#### レスポンス
```typescript
interface UserReferralStatsResponse {
  user: {
    id: string;
    username: string;
    referralCount: number;
    ranking: number;
    rankBadge: string;
  };

  stats: {
    totalReferrals: number;
    thisMonth: number;
    bestMonth: {
      month: string;
      count: number;
    };
    topReferredPoll: {
      id: string;
      title: string;
      referralCount: number;
    };
  };

  recentReferrals: Array<{
    pollId: string;
    pollTitle: string;
    referredAt: string;
    platform: string;
  }>;
}
```

### 6.3 GET /api/referrals/ranking
紹介ランキング取得

#### クエリパラメータ
```typescript
interface RankingQuery {
  period?: 'all' | 'month' | 'week';
  limit?: number;                   // 最大100
}
```

#### レスポンス
```typescript
interface ReferralRankingResponse {
  ranking: Array<{
    rank: number;
    user: {
      id: string;
      username: string;
      referralCount: number;
      rankBadge: string;
    };
    periodReferrals: number;        // 期間内の紹介数
  }>;

  currentUser?: {
    rank: number;
    referralCount: number;
    rankBadge: string;
  };
}
```

## 7. エラーハンドリング

### 7.1 エラーコード定義
```typescript
enum ErrorCode {
  // 認証エラー
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST_FORMAT = 'INVALID_REQUEST_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // ビジネスロジックエラー
  POLL_EXPIRED = 'POLL_EXPIRED',
  ALREADY_VOTED = 'ALREADY_VOTED',
  VOTE_LIMIT_EXCEEDED = 'VOTE_LIMIT_EXCEEDED',
  INVALID_VOTE_OPTION = 'INVALID_VOTE_OPTION',

  // レート制限
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // サーバーエラー
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

### 7.2 HTTPステータスコードマッピング
```typescript
const statusCodeMap = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 403,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_REQUEST_FORMAT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,

  [ErrorCode.POLL_EXPIRED]: 410,
  [ErrorCode.ALREADY_VOTED]: 409,
  [ErrorCode.VOTE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INVALID_VOTE_OPTION]: 400,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502
};
```

### 7.3 エラーレスポンス例
```typescript
// バリデーションエラー
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データにエラーがあります",
    "details": {
      "title": ["タイトルは200文字以内で入力してください"],
      "options": ["選択肢は2個以上4個以下で設定してください"]
    }
  },
  "meta": {
    "timestamp": "2025-01-16T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}

// 認証エラー
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "認証トークンの有効期限が切れています。再ログインしてください。"
  },
  "meta": {
    "timestamp": "2025-01-16T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}

// レート制限エラー
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト制限に達しました。しばらく時間をおいてからお試しください。",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "remaining": 0,
      "resetTime": "2025-01-16T13:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-01-16T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

## 8. セキュリティ仕様

### 8.1 レート制限
```typescript
interface RateLimitConfig {
  // 一般エンドポイント
  general: {
    windowMs: 60000;                // 1分
    max: 100;                       // 100リクエスト/分
  };

  // 認証関連
  auth: {
    windowMs: 900000;               // 15分
    max: 5;                         // 5回/15分
  };

  // 投票関連
  voting: {
    windowMs: 60000;                // 1分
    max: 5;                         // 5投票/分
  };

  // 管理者
  admin: {
    windowMs: 60000;                // 1分
    max: 200;                       // 200リクエスト/分
  };
}
```

### 8.2 入力サニタイゼーション
```typescript
// XSS対策
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// SQLインジェクション対策（Prisma ORM使用）
// パラメーター化クエリを自動生成

// NoSQLインジェクション対策
const sanitizeMongoInput = (input: any): any => {
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (!key.startsWith('$') && !key.includes('.')) {
        sanitized[key] = sanitizeMongoInput(value);
      }
    }
    return sanitized;
  }
  return input;
};
```

### 8.3 CORS設定
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://vote-site.com', 'https://www.vote-site.com']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400                     // 24時間
};
```

## 9. パフォーマンス最適化

### 9.1 キャッシュ戦略
```typescript
interface CacheConfig {
  // 投票一覧（短期キャッシュ）
  polls: {
    ttl: 300;                       // 5分
    key: 'polls:list:{hash}';
  };

  // 投票詳細（中期キャッシュ）
  pollDetail: {
    ttl: 1800;                      // 30分
    key: 'poll:detail:{id}';
  };

  // 統計データ（長期キャッシュ）
  stats: {
    ttl: 3600;                      // 1時間
    key: 'poll:stats:{id}:{filter}';
  };

  // ユーザー情報（中期キャッシュ）
  user: {
    ttl: 1800;                      // 30分
    key: 'user:info:{id}';
  };
}
```

### 9.2 データベースクエリ最適化
```typescript
// N+1問題の解決
const getVotesWithUser = async (pollId: string) => {
  return await prisma.pollVote.findMany({
    where: { pollId },
    include: {
      user: {
        select: { id: true, username: true, prefecture: true }
      }
    }
  });
};

// バッチ処理
const getMultiplePollStats = async (pollIds: string[]) => {
  const votes = await prisma.pollVote.groupBy({
    by: ['pollId', 'option'],
    where: { pollId: { in: pollIds } },
    _count: { _all: true }
  });

  return votes.reduce((acc, vote) => {
    if (!acc[vote.pollId]) acc[vote.pollId] = [];
    acc[vote.pollId].push({
      option: vote.option,
      count: vote._count._all
    });
    return acc;
  }, {} as Record<string, any[]>);
};
```

## 10. ログ・監視

### 10.1 ログ形式
```typescript
interface ApiLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  userId?: string;
  requestId: string;
  error?: {
    message: string;
    stack: string;
    code: string;
  };
  metadata?: any;
}
```

### 10.2 メトリクス収集
```typescript
interface ApiMetrics {
  // レスポンス時間
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };

  // エラー率
  errorRate: {
    total: number;
    rate: number;
    by4xx: number;
    by5xx: number;
  };

  // スループット
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };

  // リソース使用量
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    dbConnections: number;
  };
}
```

## 11. APIドキュメント生成

### 11.1 OpenAPI仕様
```yaml
openapi: 3.0.0
info:
  title: みんなの投票 API
  version: 1.0.0
  description: 汎用投票プラットフォーム API
servers:
  - url: https://api.vote-site.com/api
    description: 本番環境
  - url: http://localhost:3001/api
    description: 開発環境

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
```

### 11.2 自動ドキュメント更新
```typescript
// Swagger UI自動生成
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'みんなの投票 API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

## 12. まとめ

本API設計書は以下の特徴を持ちます：

### 12.1 設計の特徴
1. **RESTful**: HTTP標準に準拠した設計
2. **セキュア**: 多層防御によるセキュリティ対策
3. **スケーラブル**: キャッシュとクエリ最適化
4. **保守性**: 一貫したエラーハンドリング
5. **監視**: 包括的なログとメトリクス

### 12.2 開発効率
- TypeScriptによる型安全性
- Zodによる実行時バリデーション
- OpenAPI仕様による自動ドキュメント生成
- 統一されたレスポンス形式

これにより、安全で高性能な投票プラットフォームAPIを構築できます。