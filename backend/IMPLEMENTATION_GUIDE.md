# バックエンドAPI実装ガイド

## 概要
このドキュメントは、日本語アクセント投票サイトのバックエンドAPI実装のためのガイドラインです。

## 実装済みコンポーネント

### 基盤レイヤー
- ✅ src/server.ts - サーバーエントリーポイント
- ✅ src/app.ts - Expressアプリケーション設定
- ✅ src/config/env.ts - 環境変数管理
- ✅ src/config/database.ts - データベース接続設定
- ✅ src/config/redis.ts - Redis接続設定

### ルーティング
- ✅ src/routes/index.ts - メインルーター
- ✅ src/routes/words.routes.ts - 語関連ルーティング

### コントローラー（例）
- ✅ src/controllers/words.controller.ts - 語関連コントローラー

### サービス（例）
- ✅ src/services/word.service.ts - 語関連サービス

## 未実装コンポーネント（要実装）

### 1. ミドルウェア
```typescript
// src/middleware/auth.ts
export const authMiddleware = async (req, res, next) => {
  // JWT認証実装
};

// src/middleware/validation.ts
export const validateRequest = (req, res, next) => {
  // バリデーション結果チェック
};
```

### 2. リポジトリ層
各エンティティに対応するリポジトリクラスを実装：

```typescript
// src/repositories/word.repository.ts
export class WordRepository {
  async searchWords(params) { /* Prisma実装 */ }
  async getWordById(id) { /* Prisma実装 */ }
  async createSubmission(data) { /* Prisma実装 */ }
}

// src/repositories/vote.repository.ts
export class VoteRepository {
  async createVote(data) { /* Prisma実装 */ }
  async getRecentVote(wordId, deviceId) { /* Prisma実装 */ }
}
```

### 3. 残りのコントローラー

#### VotesController
- POST /api/votes - 投票
- DELETE /api/votes/:id - 投票取り消し

#### AuthController
- POST /api/auth/signup - サインアップ
- POST /api/auth/login - ログイン
- POST /api/auth/logout - ログアウト
- GET /api/auth/me - ユーザー情報

#### RankingController
- GET /api/ranking - ランキング取得

#### StatsController
- GET /api/stats/summary - サイト統計
- GET /api/stats/trends - トレンド分析

#### AdminController
- GET /api/admin/submissions - 投稿一覧
- PUT /api/admin/submissions/:id - 承認・却下

#### MasterDataController
- GET /api/prefectures - 都道府県一覧
- GET /api/categories - カテゴリ一覧
- GET /api/accent-types - アクセント型一覧

### 4. 残りのルーティング
各コントローラーに対応するルーティングファイルを作成：

```typescript
// src/routes/votes.routes.ts
// src/routes/auth.routes.ts
// src/routes/ranking.routes.ts
// src/routes/stats.routes.ts
// src/routes/admin.routes.ts
// src/routes/master.routes.ts
```

## Prismaスキーマ設定

### 1. Prismaスキーマファイル作成
```bash
npx prisma init
```

### 2. スキーマ定義（prisma/schema.prisma）
既存のSQLスキーマをPrismaスキーマに変換

### 3. マイグレーション実行
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 環境設定

### 必要な.envファイル
```env
# Node.js
NODE_ENV=development
PORT=8000

# Database
DATABASE_URL=postgresql://accent_user:accent_password@localhost:5432/accent_vote_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=your-session-secret-at-least-32-characters

# Security
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_VOTE_PER_HOUR=60
RATE_LIMIT_SUBMIT_PER_DAY=10
RATE_LIMIT_API_PER_MINUTE=100

# Cloudflare Turnstile (optional for dev)
TURNSTILE_SECRET_KEY=test-key

# Logging
LOG_LEVEL=debug
```

## 実装手順

### Phase 1: 基盤構築（完了）
- [x] サーバー基本設定
- [x] 環境変数管理
- [x] データベース接続
- [x] Redis接続

### Phase 2: 認証システム
1. JWT認証ミドルウェア実装
2. AuthControllerの実装
3. 認証サービスの実装
4. セッション管理の実装

### Phase 3: 主要API実装
1. VotesController実装
2. VoteService実装
3. VoteRepository実装
4. 投票ロジックの実装

### Phase 4: 統計・ランキング
1. StatsController実装
2. RankingController実装
3. 集計ロジックの実装
4. キャッシュ戦略の実装

### Phase 5: 管理機能
1. AdminController実装
2. 承認フローの実装
3. 権限チェックミドルウェア

### Phase 6: テスト実装
1. ユニットテスト
2. 統合テスト
3. E2Eテスト

## テスト実行

### ユニットテスト
```bash
npm test
```

### 統合テスト
```bash
npm run test:integration
```

### カバレッジ確認
```bash
npm run test:coverage
```

## デバッグ

### 開発サーバー起動
```bash
npm run dev
```

### ログ確認
- 開発環境: コンソール出力
- 本番環境: logs/ディレクトリ

### データベース確認
```bash
npx prisma studio
```

## デプロイメント

### ビルド
```bash
npm run build
```

### 本番起動
```bash
npm start
```

### Dockerコンテナ
```bash
docker-compose up -d
```

## トラブルシューティング

### データベース接続エラー
1. PostgreSQLが起動しているか確認
2. DATABASE_URLが正しいか確認
3. データベースが作成されているか確認

### Redis接続エラー
1. Redisが起動しているか確認
2. REDIS_URLが正しいか確認

### 認証エラー
1. JWT_SECRETが設定されているか確認
2. トークンの有効期限を確認

## 参考資料

- [API仕様書](../ref/product/design/api_specification.md)
- [データベース設計](../ref/product/design/database_schema.sql)
- [システムアーキテクチャ](../ref/product/design/system_architecture.md)

## サポート

問題が発生した場合は、以下を確認してください：

1. ログファイルのエラーメッセージ
2. 環境変数の設定
3. 依存関係のバージョン
4. データベース接続状態

## 次のステップ

1. 残りのコントローラーを実装
2. リポジトリ層を完成
3. 認証システムを実装
4. テストを追加
5. デプロイメント準備