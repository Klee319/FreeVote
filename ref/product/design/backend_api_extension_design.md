# みんなの投票プラットフォーム - バックエンドAPI拡張設計書

## 1. 概要

この設計書は、みんなの投票プラットフォームのバックエンドAPIを拡張し、以下の新機能を追加するための技術仕様を定義します：

1. 投票提案機能
2. シェアランキング機能
3. ユーザー設定の拡張
4. 管理者ダッシュボード機能

## 2. 現在のアーキテクチャ分析

### 2.1 現在のPrismaスキーマ
- **User**: ユーザー情報（基本プロフィール、SNS連携）
- **Poll**: 投票情報（アクセントモード対応）
- **PollVote**: 投票記録（都道府県・属性別集計対応）
- **UserVoteRequest**: ユーザー投票提案（基本機能実装済み）
- **UserReferral**: ユーザー紹介記録
- **RefreshToken**: JWT認証用リフレッシュトークン
- **AppSettings**: アプリ設定

### 2.2 現在のAPI構造
- **Auth Routes**: `/auth/*` - 認証・認可機能
- **Polls Routes**: `/polls/*` - 投票関連機能
- **Admin Routes**: `/admin/*` - 管理者機能

### 2.3 現在のサービス層
- **AuthService**: JWT認証、ユーザー管理
- **PollsService**: 投票作成・投票・統計機能
- **AdminService**: 管理者機能（投票管理、ユーザー提案承認）

## 3. 新機能のためのデータベーススキーマ拡張

### 3.1 ユーザーモデルの拡張

```prisma
model User {
  id            String          @id @default(uuid())
  username      String?         @unique
  email         String?         @unique
  passwordHash  String?
  ageGroup      String          // 10代、20代、30代...
  prefecture    String          // 都道府県コード
  gender        String          // 男性/女性/その他

  // 拡張フィールド
  profileImageUrl  String?      // プロフィール画像URL
  bio              String?      // 自己紹介文
  lastStatusUpdate DateTime?    // 最後のステータス更新日（年1回制限用）
  shareCount       Int          @default(0) // 総シェア数
  showInRanking    Boolean      @default(true) // ランキング表示設定

  // SNS連携の拡張
  provider      String?         // twitter, instagram, tiktok
  providerId    String?
  twitterHandle String?         // Twitterハンドル
  instagramHandle String?       // Instagramハンドル
  tiktokHandle  String?         // TikTokハンドル

  referralCount Int             @default(0)
  isAdmin       Boolean         @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  votes         PollVote[]
  referrals     UserReferral[]
  pollsCreated  Poll[]
  refreshTokens RefreshToken[]
  requests      UserVoteRequest[]
  shareActivities UserShareActivity[] // 新規追加

  @@index([email])
  @@index([provider, providerId])
  @@index([shareCount])
}
```

### 3.2 新規テーブル: ユーザーシェア活動記録

```prisma
model UserShareActivity {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pollId    String
  poll      Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  platform  String   // twitter, instagram, tiktok, line, copy
  sharedAt  DateTime @default(now())

  @@unique([userId, pollId, platform]) // 同一ユーザー・投票・プラットフォーム重複防止
  @@index([userId])
  @@index([sharedAt])
  @@index([platform])
}
```

### 3.3 新規テーブル: シェアランキングキャッシュ

```prisma
model ShareRanking {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  period      String   // daily, weekly, monthly, all_time
  shareCount  Int      @default(0)
  rank        Int
  calculatedAt DateTime @default(now())

  @@unique([userId, period])
  @@index([period, rank])
  @@index([calculatedAt])
}
```

### 3.4 投票モデルの拡張

```prisma
model Poll {
  // 既存フィールドはそのまま維持
  id                String      @id @default(uuid())
  title             String
  description       String?
  isAccentMode      Boolean     @default(false)
  wordId            Int?
  options           Json
  deadline          DateTime?
  shareMessage      String?
  shareHashtags     String?
  thumbnailUrl      String?
  optionThumbnails  Json?
  categories        String[]
  status            String      @default("active")
  viewCount         Int         @default(0)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  createdBy         String
  creator           User        @relation(fields: [createdBy], references: [id])

  // 拡張フィールド
  shareCount        Int         @default(0) // 総シェア数

  votes             PollVote[]
  referrals         UserReferral[]
  shareActivities   UserShareActivity[] // 新規追加

  @@index([status])
  @@index([createdAt])
  @@index([deadline])
  @@index([shareCount]) // 新規追加
}
```

### 3.5 ユーザー投票提案モデルの拡張

```prisma
model UserVoteRequest {
  id            String   @id @default(uuid())
  title         String
  description   String?
  options       Json
  categories    String[]
  likeCount     Int      @default(0)
  status        String   @default("pending") // pending, approved, rejected

  // 拡張フィールド
  rejectionReason String? // 却下理由
  adminComment    String? // 管理者コメント
  reviewedAt      DateTime? // レビュー日時
  reviewedBy      String?   // レビュー担当者ID

  userId        String?
  user          User?    @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([reviewedAt])
}
```

## 4. API エンドポイント設計

### 4.1 投票提案機能 API

#### ユーザー向けAPI
```typescript
// 投票提案の作成
POST /api/polls/proposals
Authorization: Bearer <token>
Body: {
  title: string;
  description?: string;
  options: Array<{label: string, description?: string}>;
  categories: string[];
}
Response: {
  success: boolean;
  data: UserVoteRequest;
}

// 自分の提案一覧取得
GET /api/polls/proposals/my?page=1&limit=10&status=pending
Authorization: Bearer <token>
Response: {
  success: boolean;
  data: {
    proposals: UserVoteRequest[];
    total: number;
    page: number;
    totalPages: number;
  }
}

// 提案詳細取得
GET /api/polls/proposals/:id
Authorization: Bearer <token>
Response: {
  success: boolean;
  data: UserVoteRequest;
}
```

#### 管理者向けAPI（既存の拡張）
```typescript
// 投票提案一覧取得（拡張）
GET /api/admin/proposals?status=pending&page=1&limit=20&search=keyword
Authorization: Bearer <admin-token>
Response: {
  success: boolean;
  data: {
    proposals: UserVoteRequest[];
    total: number;
    page: number;
    totalPages: number;
  }
}

// 投票提案承認（拡張）
POST /api/admin/proposals/:id/approve
Authorization: Bearer <admin-token>
Body: {
  adminComment?: string;
  customDeadline?: string; // ISO日付文字列
  customCategories?: string[];
}
Response: {
  success: boolean;
  data: Poll; // 作成された投票
}

// 投票提案却下（拡張）
POST /api/admin/proposals/:id/reject
Authorization: Bearer <admin-token>
Body: {
  reason: string;
  adminComment?: string;
}
Response: {
  success: boolean;
  message: string;
}
```

### 4.2 シェアランキング機能 API

```typescript
// シェア記録
POST /api/polls/:pollId/share
Authorization: Bearer <token> (optional)
Body: {
  platform: 'twitter' | 'instagram' | 'tiktok' | 'line' | 'copy';
}
Response: {
  success: boolean;
  data: {
    shareCount: number;
    userShareCount?: number; // ログイン時のみ
  }
}

// シェアランキング取得
GET /api/rankings/share?period=weekly&limit=50
Response: {
  success: boolean;
  data: {
    period: string;
    rankings: Array<{
      rank: number;
      user: {
        id: string;
        username: string;
        profileImageUrl?: string;
      };
      shareCount: number;
    }>;
    updatedAt: string;
  }
}

// ユーザー個人のシェア統計
GET /api/users/me/share-stats
Authorization: Bearer <token>
Response: {
  success: boolean;
  data: {
    totalShares: number;
    dailyShares: number;
    weeklyShares: number;
    monthlyShares: number;
    rankings: {
      daily?: { rank: number, totalUsers: number };
      weekly?: { rank: number, totalUsers: number };
      monthly?: { rank: number, totalUsers: number };
      allTime?: { rank: number, totalUsers: number };
    };
  }
}
```

### 4.3 ユーザー設定拡張 API

```typescript
// プロフィール更新（拡張）
PUT /api/users/me/profile
Authorization: Bearer <token>
Body: {
  username?: string;
  bio?: string;
  showInRanking?: boolean;
  twitterHandle?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
}
Response: {
  success: boolean;
  data: User;
}

// ユーザーステータス更新（年1回制限）
PUT /api/users/me/status
Authorization: Bearer <token>
Body: {
  ageGroup?: string;
  prefecture?: string;
  gender?: string;
}
Response: {
  success: boolean;
  data: User;
}
Errors: {
  400: "今年度は既にステータスを更新済みです"
}

// プロフィール画像アップロード
POST /api/users/me/profile-image
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: FormData with 'image' field
Response: {
  success: boolean;
  data: {
    profileImageUrl: string;
  }
}

// 投票履歴取得
GET /api/users/me/voting-history?page=1&limit=20&category=all
Authorization: Bearer <token>
Response: {
  success: boolean;
  data: {
    votes: Array<{
      poll: {
        id: string;
        title: string;
        categories: string[];
        thumbnailUrl?: string;
      };
      option: number;
      votedAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }
}
```

### 4.4 管理者ダッシュボード API（拡張）

```typescript
// ダッシュボード統計（拡張）
GET /api/admin/dashboard/stats
Authorization: Bearer <admin-token>
Response: {
  success: boolean;
  data: {
    // 既存統計
    totalVotes: number;
    totalUsers: number;
    activePolls: number;
    pendingRequests: number;

    // 新規統計
    totalShares: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    topCategories: Array<{category: string, count: number}>;
    sharesByPlatform: Record<string, number>;

    // トレンド（過去7日間）
    votesTrend: Array<{date: string, count: number}>;
    usersTrend: Array<{date: string, count: number}>;
    sharesTrend: Array<{date: string, count: number}>;

    // 成長率
    votesGrowth: number;
    usersGrowth: number;
    sharesGrowth: number;
  }
}

// システム設定管理
GET /api/admin/settings
PUT /api/admin/settings
Authorization: Bearer <admin-token>
Body: {
  settings: Record<string, any>;
}
```

## 5. サービス層の拡張設計

### 5.1 新規サービス: ShareService

```typescript
export class ShareService {
  // シェア記録
  async recordShare(params: {
    pollId: string;
    userId?: string;
    platform: string;
  }): Promise<{shareCount: number, userShareCount?: number}>;

  // ランキング計算
  async calculateRankings(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): Promise<void>;

  // ランキング取得
  async getRankings(params: {
    period: string;
    limit: number;
    offset?: number;
  }): Promise<ShareRankingResult>;

  // ユーザー統計取得
  async getUserShareStats(userId: string): Promise<UserShareStats>;
}
```

### 5.2 新規サービス: ProposalService

```typescript
export class ProposalService {
  // 提案作成
  async createProposal(params: CreateProposalParams): Promise<UserVoteRequest>;

  // ユーザーの提案一覧
  async getUserProposals(params: {
    userId: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedProposals>;

  // 管理者向け提案一覧
  async getProposalsForAdmin(params: AdminProposalParams): Promise<PaginatedProposals>;

  // 提案承認
  async approveProposal(params: {
    proposalId: string;
    adminId: string;
    adminComment?: string;
    customSettings?: ProposalCustomSettings;
  }): Promise<Poll>;

  // 提案却下
  async rejectProposal(params: {
    proposalId: string;
    adminId: string;
    reason: string;
    adminComment?: string;
  }): Promise<void>;
}
```

### 5.3 UserService の拡張

```typescript
export class UserService {
  // プロフィール更新
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<User>;

  // ステータス更新（年1回制限チェック付き）
  async updateStatus(userId: string, data: StatusUpdateData): Promise<User>;

  // プロフィール画像更新
  async updateProfileImage(userId: string, imageFile: File): Promise<string>;

  // 投票履歴取得
  async getVotingHistory(params: VotingHistoryParams): Promise<PaginatedVotingHistory>;

  // ユーザー統計取得
  async getUserStats(userId: string): Promise<UserStats>;
}
```

## 6. セキュリティ考慮事項

### 6.1 認証・認可
1. **JWT トークンの検証**
   - アクセストークン（15分）とリフレッシュトークン（7日）の継続使用
   - 管理者権限の厳密なチェック

2. **API レート制限**
   - シェア記録: 1分間に10回まで
   - 投票提案作成: 1時間に3件まで
   - プロフィール更新: 1時間に5回まで

### 6.2 データ検証
1. **入力検証（Zod使用）**
   ```typescript
   const proposalCreateSchema = z.object({
     title: z.string().min(5).max(100),
     description: z.string().max(500).optional(),
     options: z.array(z.object({
       label: z.string().min(1).max(50),
       description: z.string().max(200).optional()
     })).min(2).max(4),
     categories: z.array(z.string()).min(1).max(3)
   });
   ```

2. **ファイルアップロード**
   - プロフィール画像: 5MB以下、JPEG/PNG/WebP
   - ファイルタイプとサイズの厳密なチェック
   - アンチウイルススキャン（本番環境）

### 6.3 権限管理
1. **ユーザー権限**
   - 自分の提案・プロフィールのみ編集可能
   - 年1回制限のステータス更新チェック

2. **管理者権限**
   - 提案の承認・却下権限
   - ユーザー管理権限
   - システム設定権限

### 6.4 データ保護
1. **個人情報の保護**
   - メールアドレスの暗号化保存継続
   - プロフィール画像のセキュアな配信

2. **ログ・監査**
   - 管理者操作のログ記録
   - 不正アクセスの検知と通知

## 7. パフォーマンス最適化

### 7.1 データベース最適化
1. **インデックス設計**
   - シェア数ランキング用インデックス
   - 投票提案の状態・日付インデックス
   - ユーザー統計用コンポジットインデックス

2. **キャッシュ戦略**
   - ランキングデータのRedisキャッシュ（15分TTL）
   - ユーザープロフィールのキャッシュ（5分TTL）

### 7.2 API 最適化
1. **バッチ処理**
   - ランキング計算の定期バッチ実行（Cron）
   - シェア数の定期集計

2. **ページネーション**
   - 全リスト系APIでのカーソルベースページング対応

## 8. 実装優先順位と段階的実装計画

### Phase 1: 基盤機能（2週間）
1. Prismaスキーマ拡張とマイグレーション
2. 基本的なバリデーションスキーマ作成
3. 既存API認証・認可の強化

### Phase 2: 投票提案機能（2週間）
1. ProposalService実装
2. ユーザー向け投票提案API
3. 管理者向け投票提案管理API拡張

### Phase 3: ユーザー設定拡張（1.5週間）
1. UserService拡張
2. プロフィール管理API
3. 画像アップロード機能
4. 投票履歴機能

### Phase 4: シェアランキング機能（2週間）
1. ShareService実装
2. シェア記録API
3. ランキング計算ロジック
4. ランキング表示API

### Phase 5: 管理者ダッシュボード拡張（1週間）
1. 統計情報の拡張
2. システム設定管理
3. 監査ログ機能

### Phase 6: 最適化・テスト（1週間）
1. パフォーマンステスト
2. セキュリティテスト
3. 統合テスト

## 9. 開発・テスト戦略

### 9.1 並列開発の実現
1. **機能単位の分離**
   - 各Phaseは独立して開発可能
   - サービス層の疎結合設計

2. **API仕様の事前確定**
   - OpenAPI仕様書の作成
   - モックサーバーでのフロントエンド並行開発

### 9.2 テスト戦略
1. **単体テスト**
   - Jest使用、カバレッジ80%以上
   - サービス層の重点的なテスト

2. **統合テスト**
   - Supertest使用のAPI統合テスト
   - データベーストランザクションテスト

3. **E2Eテスト**
   - Playwright使用
   - 主要フローの自動テスト

## 10. 運用・監視

### 10.1 ログ・監視
1. **アプリケーションログ**
   - 構造化ログ（JSON形式）
   - エラー通知システム

2. **メトリクス監視**
   - API レスポンス時間
   - データベース性能
   - ユーザー活動メトリクス

### 10.2 デプロイメント
1. **段階的デプロイ**
   - ステージング環境での検証
   - カナリアデプロイメント

2. **ロールバック戦略**
   - データベースマイグレーションの互換性保持
   - 機能フラグによる段階的リリース

## 11. 関連ドキュメント

- `./ProductDevelop.md` - 製品開発プロセス
- `../api/openapi.yaml` - API仕様書（作成予定）
- `../database/migration_plan.md` - データベース移行計画（作成予定）
- `../security/security_checklist.md` - セキュリティチェックリスト（作成予定）

---

この設計書は、みんなの投票プラットフォームの要件に基づいて作成されており、スケーラブルで保守性の高いアーキテクチャを提供します。実装時は各フェーズの完了後にレビューを行い、必要に応じて設計の調整を行ってください。