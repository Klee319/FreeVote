# みんなの投票 - 詳細技術仕様書

## 1. システム概要

### 1.1 プロジェクト概要
- **サイト名**: みんなの投票
- **目的**: 誰でも簡単に投票に参加でき、SNSで拡散しやすい汎用投票プラットフォーム
- **特徴**: アクセント投票機能を含む、時事・エンタメ・雑学など幅広いテーマに対応

### 1.2 技術スタック
| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js (App Router) | 14.x |
| | React | 18.x |
| | TypeScript | 5.x |
| UIライブラリ | Tailwind CSS | 3.x |
| | shadcn/ui | latest |
| 状態管理 | Zustand | 4.x |
| バックエンド | Node.js | 18+ |
| | Express | 4.x |
| | Prisma ORM | 5.x |
| データベース | PostgreSQL | 15+ |
| 認証 | JWT | - |
| 地図表示 | React Simple Maps | 3.x |
| 音声合成 | Web Speech API | - |
| ホスティング | Vercel (Frontend) | - |
| | Railway/Supabase (Backend) | - |

### 1.3 パフォーマンス要件
- **同時接続数**: 最大1000人
- **API応答時間**: 1秒以内
- **データ保持期間**: 永久保存
- **可用性**: 99.9%

## 2. プロジェクト構成

```
vote-site/
├── frontend/                    # Next.js アプリケーション
│   ├── app/                    # App Router
│   │   ├── (main)/            # メインレイアウト
│   │   │   ├── page.tsx       # トップページ
│   │   │   ├── polls/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── stats/
│   │   │   │       └── page.tsx
│   │   │   ├── request/
│   │   │   └── search/
│   │   ├── admin/             # 管理画面
│   │   │   ├── layout.tsx
│   │   │   └── polls/
│   │   ├── auth/              # 認証
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── api/               # API Routes
│   ├── components/            # UIコンポーネント
│   │   ├── ui/               # shadcn/ui
│   │   ├── features/         # 機能別コンポーネント
│   │   └── layout/           # レイアウト
│   ├── lib/                  # ユーティリティ
│   ├── hooks/                # カスタムフック
│   ├── stores/               # Zustand ストア
│   └── types/                # 型定義
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── controllers/      # コントローラー
│   │   ├── services/         # ビジネスロジック
│   │   ├── middleware/       # ミドルウェア
│   │   ├── routes/           # ルーティング
│   │   ├── utils/            # ユーティリティ
│   │   └── types/            # 型定義
│   ├── prisma/
│   │   ├── schema.prisma     # データベーススキーマ
│   │   ├── migrations/       # マイグレーション
│   │   └── seed.ts          # シードデータ
│   └── tests/                # テスト
│
├── shared/                    # 共通コード
│   └── types/                # 共通型定義
│
└── docs/                      # ドキュメント
```

## 3. データベース設計

### 3.1 スキーマ定義（Prisma）

```prisma
// Users テーブル
model User {
  id            String   @id @default(uuid())
  username      String?
  email         String?  @unique
  passwordHash  String?
  ageGroup      String   // 10代、20代、30代...
  prefecture    String   // 都道府県コード
  gender        String   // male, female, other
  provider      String?  // twitter, instagram, tiktok
  providerId    String?
  referralCount Int      @default(0)
  role          String   @default("user") // user, admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  votes         PollVote[]
  referrals     UserReferral[]
  requests      UserVoteRequest[]
}

// Polls テーブル
model Poll {
  id               String   @id @default(uuid())
  title            String
  description      String
  isAccentMode     Boolean  @default(false)
  wordId           Int?
  options          Json     // 選択肢配列
  deadline         DateTime
  shareMessage     String?
  shareHashtags    String?
  thumbnailUrl     String?
  optionThumbnails Json?
  categories       String[]
  createdAt        DateTime @default(now())
  createdBy        String
  isActive         Boolean  @default(true)

  votes            PollVote[]
  word             Word?     @relation(fields: [wordId], references: [id])
  creator          User      @relation(fields: [createdBy], references: [id])
}

// PollVotes テーブル
model PollVote {
  id         String   @id @default(uuid())
  pollId     String
  option     Int      // 0-3
  prefecture String
  ageGroup   String?
  gender     String?
  userId     String?
  userToken  String   // 匿名トークン
  votedAt    DateTime @default(now())

  poll       Poll     @relation(fields: [pollId], references: [id])
  user       User?    @relation(fields: [userId], references: [id])

  @@index([pollId, userToken])
}

// UserVoteRequests テーブル
model UserVoteRequest {
  id          String   @id @default(uuid())
  title       String
  description String
  options     Json
  likeCount   Int      @default(0)
  status      String   @default("pending") // pending, approved, rejected
  createdBy   String?
  createdAt   DateTime @default(now())

  creator     User?    @relation(fields: [createdBy], references: [id])
}

// UserReferrals テーブル
model UserReferral {
  id           String   @id @default(uuid())
  userId       String
  pollId       String
  visitorToken String
  referredAt   DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])

  @@unique([userId, visitorToken, pollId])
}

// Words テーブル（アクセント投票用）
model Word {
  id           Int      @id @default(autoincrement())
  word         String   @unique
  reading      String
  moraCount    Int
  accentType   String
  description  String?
  createdAt    DateTime @default(now())

  polls        Poll[]
}

// AppSettings テーブル
model AppSettings {
  id          String   @id @default("default")
  siteName    String   @default("みんなの投票")
  rateLimit   Int      @default(60) // requests per minute
  jwtExpiry   Int      @default(900) // seconds (15 minutes)
  refreshExpiry Int    @default(604800) // seconds (7 days)
  updatedAt   DateTime @updatedAt
}
```

### 3.2 インデックス設計
- PollVote: (pollId, userToken) - 重複投票チェック用
- UserReferral: (userId, visitorToken, pollId) - ユニーク制約
- User: (email) - ログイン用
- Poll: (isActive, deadline) - アクティブな投票の取得用

## 4. API仕様

### 4.1 認証API

#### POST /api/auth/register
```typescript
// Request
{
  email: string;
  password: string;
  username?: string;
  ageGroup: "10代" | "20代" | "30代" | "40代" | "50代" | "60代以上";
  prefecture: string; // 都道府県コード
  gender: "male" | "female" | "other";
}

// Response (200 OK)
{
  success: true;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      ageGroup: string;
      prefecture: string;
      gender: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}
```

#### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response (200 OK)
{
  success: true;
  data: {
    user: UserInfo;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}
```

### 4.2 投票API

#### GET /api/polls
```typescript
// Query Parameters
{
  category?: string;
  sort?: "new" | "trending" | "voteCount";
  search?: string;
  page?: number;
  limit?: number;
}

// Response
{
  success: true;
  data: {
    polls: Poll[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
```

#### GET /api/polls/:id
```typescript
// Response
{
  success: true;
  data: {
    poll: {
      id: string;
      title: string;
      description: string;
      options: Array<{
        label: string;
        thumbnailUrl?: string;
        pitchPattern?: number[]; // アクセントモード時
        voiceSampleUrl?: string; // アクセントモード時
      }>;
      deadline: string;
      categories: string[];
      voteCount: number;
      results?: { // 投票済みの場合
        totalVotes: number;
        distribution: Array<{
          option: number;
          count: number;
          percentage: number;
        }>;
      };
    };
  };
}
```

#### POST /api/polls/:id/votes
```typescript
// Request
{
  option: number; // 0-3
  prefecture: string;
  ageGroup?: string;
  gender?: string;
  userToken?: string; // 初回は空、2回目以降は必須
}

// Response
{
  success: true;
  data: {
    userToken: string; // 初回のみ返却
    results: {
      totalVotes: number;
      distribution: Array<{
        option: number;
        count: number;
        percentage: number;
      }>;
    };
  };
}
```

### 4.3 統計API

#### GET /api/polls/:id/stats
```typescript
// Query Parameters
{
  filterBy?: "age" | "gender" | "prefecture";
}

// Response
{
  success: true;
  data: {
    stats: {
      total: number;
      breakdown: Array<{
        category: string;
        data: Array<{
          option: number;
          count: number;
          percentage: number;
        }>;
      }>;
    };
  };
}
```

#### GET /api/polls/:id/map-data
```typescript
// Response
{
  success: true;
  data: {
    mapData: Array<{
      prefecture: string;
      topOption: number;
      distribution: Array<{
        option: number;
        count: number;
      }>;
    }>;
  };
}
```

### 4.4 管理API

#### POST /api/admin/polls
```typescript
// Request (管理者認証必須)
{
  title: string;
  description: string;
  isAccentMode: boolean;
  wordId?: number;
  options: Array<{
    label: string;
    thumbnailUrl?: string;
    pitchPattern?: number[];
  }>;
  deadline: string;
  categories: string[];
  shareMessage?: string;
  shareHashtags?: string;
}

// Response
{
  success: true;
  data: {
    poll: Poll;
  };
}
```

### 4.5 エラーレスポンス
```typescript
// Error Response
{
  success: false;
  error: {
    code: string; // ERROR_CODE
    message: string;
    details?: any;
  };
}

// Error Codes
- AUTH_INVALID_CREDENTIALS
- AUTH_TOKEN_EXPIRED
- VALIDATION_ERROR
- NOT_FOUND
- RATE_LIMIT_EXCEEDED
- INTERNAL_SERVER_ERROR
```

## 5. セキュリティ設計

### 5.1 認証・認可
- **JWT設定**:
  - アクセストークン: 15分有効
  - リフレッシュトークン: 7日有効
  - 署名アルゴリズム: RS256
  - トークン保存: httpOnly Cookie + localStorage(backup)

### 5.2 セキュリティ対策
| 脅威 | 対策 |
|------|------|
| XSS | React自動エスケープ + CSP設定 |
| CSRF | SameSite Cookie + CSRFトークン |
| SQLインジェクション | Prisma ORM使用 |
| DDoS | レート制限（60req/min） + Cloudflare |
| 不正投票 | IPアドレス + デバイスフィンガープリント |

### 5.3 ログ管理
- **アクセスログ**: 1か月保持
- **エラーログ**: 1週間保持
- **管理操作ログ**: 1週間保持（コンソール出力）
- **ログレベル**: info, warn, error, critical

## 6. フロントエンド設計

### 6.1 ページ構成
```
/                          # トップページ
/polls/[id]               # 投票詳細
/polls/[id]/stats         # 統計表示
/request                  # 投票提案
/search                   # 検索
/auth/login              # ログイン
/auth/register           # 新規登録
/admin                   # 管理画面トップ
/admin/polls/new         # 投票作成
/admin/polls/[id]/edit   # 投票編集
/admin/requests          # 提案管理
/admin/stats             # 統計ダッシュボード
```

### 6.2 コンポーネント設計
```typescript
// 主要コンポーネント
components/
├── ui/                    # shadcn/ui基本コンポーネント
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── features/
│   ├── polls/
│   │   ├── PollCard.tsx
│   │   ├── PollList.tsx
│   │   ├── VoteForm.tsx
│   │   └── PollResults.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── map/
│   │   └── JapanMap.tsx
│   └── voice/
│       └── AccentPlayer.tsx
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    └── AdminSidebar.tsx
```

### 6.3 状態管理（Zustand）
```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null;
  tokens: Tokens | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// stores/pollStore.ts
interface PollStore {
  polls: Poll[];
  currentPoll: Poll | null;
  fetchPolls: (params: FetchParams) => Promise<void>;
  vote: (pollId: string, option: number) => Promise<void>;
}
```

## 7. 音声機能仕様

### 7.1 Web Speech API実装
```typescript
interface AccentVoiceConfig {
  text: string;
  pitchPattern: number[]; // 0-2の値の配列
  rate: number;           // 0.1-10 (default: 1)
  pitch: number;          // 0-2 (default: 1)
  volume: number;         // 0-1 (default: 1)
}

// イントネーション表現
// pitchPattern例: [0, 1, 1, 0] = 低高高低
// 各モーラに対応するピッチを数値で表現
```

### 7.2 音声生成フロー
1. テキストをモーラ単位に分解
2. 各モーラにピッチパターンを適用
3. Web Speech APIで合成
4. リアルタイム再生

## 8. 地図表示機能

### 8.1 React Simple Maps実装
```typescript
interface MapData {
  prefecture: string;
  topOption: number;
  color: string;
  voteCount: number;
}

// 都道府県ごとの色分け
const colorScale = {
  option0: "#FF6B6B",
  option1: "#4ECDC4",
  option2: "#45B7D1",
  option3: "#96CEB4"
};
```

## 9. シードデータ仕様

### 9.1 初期データ（データベース投入）
```typescript
// prisma/seed.ts
const samplePolls = [
  {
    title: "好きなラーメンの種類は？",
    description: "日本で人気のラーメンについて投票してください",
    options: [
      { label: "醤油ラーメン", thumbnailUrl: "/images/shoyu.jpg" },
      { label: "味噌ラーメン", thumbnailUrl: "/images/miso.jpg" },
      { label: "塩ラーメン", thumbnailUrl: "/images/shio.jpg" },
      { label: "とんこつラーメン", thumbnailUrl: "/images/tonkotsu.jpg" }
    ],
    categories: ["グルメ", "アンケート"],
    deadline: new Date("2025-12-31")
  },
  // ... 他のサンプル投票
];

const sampleWords = [
  { word: "雨", reading: "あめ", moraCount: 2, accentType: "平板型" },
  { word: "橋", reading: "はし", moraCount: 2, accentType: "頭高型" },
  // ... アクセント用サンプル単語
];
```

## 10. 開発環境セットアップ

### 10.1 必要な環境
- Node.js 18+
- PostgreSQL 15+
- pnpm 8+

### 10.2 環境変数
```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# .env (Backend)
DATABASE_URL=postgresql://user:password@localhost:5432/votesite
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3001
```

### 10.3 初期セットアップコマンド
```bash
# プロジェクトセットアップ
pnpm install

# データベース初期化
cd backend
pnpm prisma migrate dev
pnpm prisma db seed

# 開発サーバー起動
pnpm dev # Frontend (port 3000)
cd backend && pnpm dev # Backend (port 3001)
```

## 11. テスト戦略

### 11.1 テストカバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%

### 11.2 テストツール
- Jest: ユニットテスト
- React Testing Library: コンポーネントテスト
- Playwright: E2Eテスト
- Supertest: API統合テスト

## 12. デプロイメント

### 12.1 CI/CDパイプライン
```yaml
# GitHub Actions
- Lint & Type Check
- Unit Tests
- Build
- Deploy to Vercel (Frontend)
- Deploy to Railway (Backend)
```

### 12.2 本番環境構成
- **Frontend**: Vercel (自動スケーリング)
- **Backend**: Railway/Supabase
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **監視**: Vercel Analytics + Custom Logging

## 13. 実装優先順位

### Phase 1 (MVP) - 2週間
1. ユーザー認証（メール登録のみ）
2. 基本的な投票機能
3. 投票結果表示
4. 管理画面（投票CRUD）

### Phase 2 - 1週間
1. X(Twitter) OAuth連携
2. 地図表示機能
3. 詳細統計機能
4. シェア機能

### Phase 3 - 1週間
1. アクセント投票モード
2. 音声合成機能
3. 紹介ランキング
4. Instagram/TikTok連携

## 14. 今後の拡張計画
- リアルタイム投票更新（WebSocket）
- 投票予測AI
- 多言語対応
- モバイルアプリ化