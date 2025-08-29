# API仕様書: 日本語アクセント投票サイト

**バージョン**: 1.0  
**最終更新日**: 2025-08-28  
**ベースURL**: `/api`

## 1. 認証・セキュリティ

### 認証方式
- **ログイン不要機能**: 検索、詳細表示、投票
- **ログイン必要機能**: 新語投稿、管理者機能
- **認証トークン**: JWT（HTTPOnly Cookie）
- **ボット対策**: Cloudflare Turnstileトークンが必要

### レート制限
- **投票**: 1時間に10回まで（IP単位）
- **検索**: 1分間に60回まで（IP単位）
- **投稿**: 1時間に3回まで（ユーザー単位）

### 共通レスポンス形式

```typescript
// 成功時
{
  success: true;
  data: any;
  message?: string;
}

// エラー時
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## 2. 語の検索・一覧API

### GET /api/words

語の検索・一覧取得

#### クエリパラメータ
```typescript
interface SearchWordsQuery {
  q?: string;           // 検索キーワード（部分一致）
  category?: string;    // カテゴリフィルタ
  page?: number;        // ページ番号（デフォルト: 1）
  limit?: number;       // 1ページあたりの件数（デフォルト: 20, 最大: 100）
  sort?: 'latest' | 'popular' | 'alphabetic'; // ソート順（デフォルト: popular）
}
```

#### レスポンス
```typescript
interface SearchWordsResponse {
  success: true;
  data: {
    words: WordSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface WordSummary {
  id: number;
  headword: string;
  reading: string;
  category: string;
  totalVotes: number;
  prefectureCount: number;
  lastVoteAt?: string;
  createdAt: string;
}
```

#### エラーコード
- `INVALID_QUERY`: 不正なクエリパラメータ
- `RATE_LIMIT_EXCEEDED`: レート制限超過

## 3. 語詳細API

### GET /api/words/[id]

語の詳細情報取得

#### パスパラメータ
- `id`: 語ID（整数）

#### レスポンス
```typescript
interface WordDetailResponse {
  success: true;
  data: {
    word: WordDetail;
    accentOptions: AccentOption[];
    aliases: string[];
    nationalStats: NationalStat[];
    canVote: boolean;
    userVote?: UserVote;
  };
}

interface WordDetail {
  id: number;
  headword: string;
  reading: string;
  category: string;
  moraCount: number;
  moraSegments: string[];
  totalVotes: number;
  prefectureCount: number;
  createdAt: string;
}

interface AccentOption {
  id: number;
  accentType: {
    code: string;
    name: string;
  };
  pattern: number[]; // [0, 1, 1, 0] 形式
  dropPosition?: number;
}

interface NationalStat {
  accentType: {
    code: string;
    name: string;
  };
  voteCount: number;
  percentage: number;
}

interface UserVote {
  accentType: string;
  prefecture: string;
  ageGroup?: string;
  votedAt: string;
}
```

#### エラーコード
- `WORD_NOT_FOUND`: 語が見つからない
- `WORD_NOT_APPROVED`: 未承認の語

## 4. 都道府県別統計API

### GET /api/words/[id]/stats

語の都道府県別統計取得

#### パスパラメータ
- `id`: 語ID（整数）

#### クエリパラメータ
```typescript
interface WordStatsQuery {
  prefecture?: string; // 特定都道府県のみ取得
}
```

#### レスポンス
```typescript
interface WordStatsResponse {
  success: true;
  data: {
    wordId: number;
    totalVotes: number;
    prefectureStats: PrefectureStat[];
    mapData: MapData;
  };
}

interface PrefectureStat {
  prefecture: {
    code: string;
    name: string;
    region: string;
  };
  totalVotes: number;
  accentDistribution: {
    accentType: string;
    voteCount: number;
    percentage: number;
  }[];
  dominantAccent: {
    type: string;
    percentage: number;
  };
}

interface MapData {
  prefectureColors: Record<string, string>; // 都道府県コード -> 色
  legend: {
    accentType: string;
    color: string;
    prefectureCount: number;
  }[];
}
```

## 5. 投票API

### POST /api/votes

アクセント型への投票

#### リクエストボディ
```typescript
interface VoteRequest {
  wordId: number;
  accentTypeId: number;
  prefecture: string;      // 都道府県コード
  ageGroup?: string;      // 年代
  turnstileToken: string; // ボット対策トークン
}
```

#### レスポンス
```typescript
interface VoteResponse {
  success: true;
  data: {
    voteId: number;
    wordId: number;
    accentType: string;
    canUndo: boolean;      // 5秒以内ならtrue
    undoExpiresAt: string; // アンドゥ期限
    updatedStats: {
      national: NationalStat[];
      prefecture: PrefectureStat;
    };
  };
}
```

#### エラーコード
- `WORD_NOT_FOUND`: 語が見つからない
- `INVALID_ACCENT_TYPE`: 不正なアクセント型
- `DUPLICATE_VOTE`: 24時間以内に投票済み
- `INVALID_PREFECTURE`: 不正な都道府県コード
- `TURNSTILE_VERIFICATION_FAILED`: ボット検証失敗
- `RATE_LIMIT_EXCEEDED`: レート制限超過

### DELETE /api/votes/[id]

投票の取り消し（5秒以内のみ）

#### パスパラメータ
- `id`: 投票ID

#### レスポンス
```typescript
interface UndoVoteResponse {
  success: true;
  data: {
    message: string;
    updatedStats: {
      national: NationalStat[];
      prefecture: PrefectureStat;
    };
  };
}
```

#### エラーコード
- `VOTE_NOT_FOUND`: 投票が見つからない
- `UNDO_EXPIRED`: アンドゥ期限切れ
- `UNAUTHORIZED`: 権限なし

## 6. ランキングAPI

### GET /api/ranking

人気語ランキング取得

#### クエリパラメータ
```typescript
interface RankingQuery {
  window?: '7d' | '30d' | 'all'; // 期間（デフォルト: 7d）
  limit?: number;                // 件数（デフォルト: 50, 最大: 100）
  category?: string;             // カテゴリフィルタ
}
```

#### レスポンス
```typescript
interface RankingResponse {
  success: true;
  data: {
    window: string;
    generatedAt: string;
    rankings: RankingItem[];
  };
}

interface RankingItem {
  rank: number;
  word: {
    id: number;
    headword: string;
    reading: string;
    category: string;
  };
  voteCount: number;
  prefectureCount: number;
  dominantAccent: string;
  rankChange?: number; // 前回との順位変動
}
```

## 7. 新着語API

### GET /api/words/recent

新着語一覧取得

#### クエリパラメータ
```typescript
interface RecentWordsQuery {
  page?: number;    // ページ番号（デフォルト: 1）
  limit?: number;   // 件数（デフォルト: 20, 最大: 50）
}
```

#### レスポンス
```typescript
interface RecentWordsResponse {
  success: true;
  data: {
    words: RecentWord[];
    pagination: PaginationInfo;
  };
}

interface RecentWord {
  id: number;
  headword: string;
  reading: string;
  category: string;
  submittedBy?: string; // 投稿者名（匿名化）
  approvedAt: string;
  initialVotes: number;
}
```

## 8. 新語投稿API

### POST /api/words

新語投稿（認証必須）

#### リクエストボディ
```typescript
interface SubmitWordRequest {
  headword: string;           // 見出し語（30文字以内）
  reading: string;            // 読み（50文字以内、カタカナ）
  categoryId: number;         // カテゴリID
  aliases?: string[];         // 別表記（任意）
  initialAccentType: string;  // 初期アクセント型
  prefecture: string;         // 投稿者の都道府県
  ageGroup?: string;         // 投稿者の年代
  turnstileToken: string;    // ボット対策トークン
}
```

#### レスポンス
```typescript
interface SubmitWordResponse {
  success: true;
  data: {
    submissionId: number;
    status: 'pending';
    estimatedReviewTime: string; // 承認予定時刻
    similarWords?: WordSummary[]; // 重複可能性のある語
  };
}
```

#### エラーコード
- `AUTHENTICATION_REQUIRED`: 認証が必要
- `INVALID_READING`: 読みが不正（非カタカナ文字）
- `WORD_ALREADY_EXISTS`: 同じ語が既に存在
- `INVALID_CATEGORY`: 不正なカテゴリ
- `TURNSTILE_VERIFICATION_FAILED`: ボット検証失敗
- `RATE_LIMIT_EXCEEDED`: 投稿制限超過

## 9. 管理者API

### GET /api/admin/submissions

投稿承認待ち一覧（管理者・モデレーター限定）

#### クエリパラメータ
```typescript
interface AdminSubmissionsQuery {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
  submittedBy?: string; // ユーザーID
}
```

#### レスポンス
```typescript
interface AdminSubmissionsResponse {
  success: true;
  data: {
    submissions: AdminSubmission[];
    pagination: PaginationInfo;
  };
}

interface AdminSubmission {
  id: number;
  headword: string;
  reading: string;
  category: string;
  aliases: string[];
  submittedBy: {
    id: string;
    email: string;
    displayName?: string;
  };
  initialAccentType: string;
  prefecture: string;
  ageGroup?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatorComment?: string;
  similarWords: WordSummary[];
  submittedAt: string;
}
```

### PUT /api/admin/submissions/[id]

投稿の承認・却下（管理者・モデレーター限定）

#### パスパラメータ
- `id`: 投稿ID

#### リクエストボディ
```typescript
interface ModerationRequest {
  action: 'approve' | 'reject';
  comment?: string; // 却下時は必須
}
```

#### レスポンス
```typescript
interface ModerationResponse {
  success: true;
  data: {
    submissionId: number;
    newStatus: 'approved' | 'rejected';
    wordId?: number;        // 承認時のみ
    notificationSent: boolean;
  };
}
```

#### エラーコード
- `UNAUTHORIZED`: 権限不足
- `SUBMISSION_NOT_FOUND`: 投稿が見つからない
- `INVALID_ACTION`: 不正なアクション
- `COMMENT_REQUIRED`: 却下時はコメント必須

## 10. 統計・分析API

### GET /api/stats/summary

サイト全体統計

#### レスポンス
```typescript
interface SiteSummaryResponse {
  success: true;
  data: {
    totalWords: number;
    totalVotes: number;
    totalUsers: number;
    activePrefectures: number;
    todayVotes: number;
    weeklyVotes: number;
    topCategories: {
      category: string;
      wordCount: number;
      voteCount: number;
    }[];
    regionDistribution: {
      region: string;
      voteCount: number;
      percentage: number;
    }[];
  };
}
```

### GET /api/stats/trends

アクセント分布トレンド（研究用）

#### クエリパラメータ
```typescript
interface TrendsQuery {
  wordId?: number;     // 特定語のトレンド
  prefecture?: string; // 特定県のトレンド
  period?: '7d' | '30d' | '90d' | '1y';
  granularity?: 'daily' | 'weekly' | 'monthly';
}
```

#### レスポンス
```typescript
interface TrendsResponse {
  success: true;
  data: {
    period: string;
    dataPoints: TrendPoint[];
  };
}

interface TrendPoint {
  date: string;
  totalVotes: number;
  accentDistribution: {
    atamadaka: number;
    heiban: number;
    nakadaka: number;
    odaka: number;
  };
  newWords: number;
}
```

## 11. ユーザー管理API

### POST /api/auth/signup

ユーザー登録

#### リクエストボディ
```typescript
interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
  prefecture?: string;
  ageGroup?: string;
  turnstileToken: string;
}
```

### POST /api/auth/login

ログイン

#### リクエストボディ
```typescript
interface LoginRequest {
  email: string;
  password: string;
  turnstileToken: string;
}
```

### POST /api/auth/logout

ログアウト

### GET /api/auth/me

ユーザー情報取得

#### レスポンス
```typescript
interface UserInfoResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      displayName?: string;
      role: 'user' | 'moderator' | 'admin';
      prefecture?: string;
      ageGroup?: string;
      createdAt: string;
    };
    stats: {
      submissionsCount: number;
      votesCount: number;
      approvedSubmissions: number;
    };
  };
}
```

## 12. マスタデータAPI

### GET /api/prefectures

都道府県一覧

#### レスポンス
```typescript
interface PrefecturesResponse {
  success: true;
  data: Prefecture[];
}

interface Prefecture {
  code: string;
  name: string;
  region: string;
}
```

### GET /api/categories

語カテゴリ一覧

#### レスポンス
```typescript
interface CategoriesResponse {
  success: true;
  data: Category[];
}

interface Category {
  id: number;
  name: string;
  description: string;
}
```

### GET /api/accent-types

アクセント型一覧

#### レスポンス
```typescript
interface AccentTypesResponse {
  success: true;
  data: AccentType[];
}

interface AccentType {
  id: number;
  code: string;
  name: string;
  description: string;
}
```

## 13. エラーレスポンス詳細

### 共通エラーコード
- `INTERNAL_SERVER_ERROR`: サーバー内部エラー
- `INVALID_REQUEST`: 不正なリクエスト形式
- `AUTHENTICATION_REQUIRED`: 認証が必要
- `UNAUTHORIZED`: 権限不足
- `NOT_FOUND`: リソースが見つからない
- `RATE_LIMIT_EXCEEDED`: レート制限超過
- `VALIDATION_ERROR`: バリデーションエラー

### HTTPステータスコード対応
- `200`: 成功
- `400`: バリデーションエラー、不正なリクエスト
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソースが見つからない
- `429`: レート制限超過
- `500`: サーバー内部エラー

## 14. WebSocket API（リアルタイム更新）

### 接続エンドポイント
`wss://example.com/api/ws`

### イベント種別

#### 投票更新通知
```typescript
interface VoteUpdateEvent {
  type: 'vote_update';
  data: {
    wordId: number;
    accentType: string;
    prefecture: string;
    updatedStats: NationalStat[];
  };
}
```

#### 新語承認通知
```typescript
interface NewWordEvent {
  type: 'word_approved';
  data: {
    word: WordSummary;
    submissionId: number;
  };
}
```

## 15. キャッシュ戦略

### レスポンスキャッシュ
- **語詳細**: 5分間キャッシュ
- **統計データ**: 10分間キャッシュ
- **ランキング**: 30分間キャッシュ
- **マスタデータ**: 24時間キャッシュ

### キャッシュ無効化
- 投票時: 該当語の統計キャッシュを削除
- 語承認時: ランキング・新着キャッシュを削除
- 管理操作時: 関連キャッシュを一括削除

## 16. API使用例

### 語検索・投票フロー
```javascript
// 1. 語検索
const searchResponse = await fetch('/api/words?q=桜');
const { words } = searchResponse.data;

// 2. 語詳細取得
const wordResponse = await fetch(`/api/words/${words[0].id}`);
const { word, accentOptions, canVote } = wordResponse.data;

// 3. 投票実行
if (canVote) {
  const voteResponse = await fetch('/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wordId: word.id,
      accentTypeId: accentOptions[0].id,
      prefecture: '13', // 東京都
      ageGroup: '30s',
      turnstileToken: 'xxx'
    })
  });
}
```

### 新語投稿フロー
```javascript
// 1. ログイン確認
const userResponse = await fetch('/api/auth/me');
if (!userResponse.success) {
  // ログインページへリダイレクト
  return;
}

// 2. 新語投稿
const submitResponse = await fetch('/api/words', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headword: '新語',
    reading: 'シンゴ',
    categoryId: 1,
    initialAccentType: 'heiban',
    prefecture: '13',
    ageGroup: '30s',
    turnstileToken: 'xxx'
  })
});
```

この API仕様書により、フロントエンドとバックエンドの開発を並行して進めることが可能です。全てのエンドポイントは TypeScript の型定義と共に提供されており、開発効率と品質の向上が期待できます。