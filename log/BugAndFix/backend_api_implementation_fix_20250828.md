# 日本語アクセント投票サイト バックエンドAPI実装修正方針書

生成日時: 2025-08-28
対象プロジェクト: 日本語アクセント投票サイト

## 不具合・エラーの概要

### 重大な問題点
1. **バックエンドAPI実装の完全欠如**
   - controllers/ディレクトリが空
   - routes/ディレクトリが空
   - サーバー起動ファイル未実装
   - 全機能が動作しない状態

2. **認証システムの不整合**
   - Supabase AuthとカスタムJWT認証が混在
   - 認証フローが不明確
   - ミドルウェア実装不完全

3. **テストコードの完全欠如**
   - ユニットテスト未実装
   - 統合テスト未実装
   - テスト環境未構築

4. **環境変数管理の不備**
   - 環境変数のバリデーション未実装
   - 設定ファイルの初期化処理なし

## 修正優先順位

### 優先度1（緊急度: 極高、影響度: 全体）
1. バックエンドサーバーの基本実装
2. 主要APIエンドポイントの実装

### 優先度2（緊急度: 高、影響度: 高）
3. 認証システムの統一と実装
4. 環境変数管理の改善

### 優先度3（緊急度: 中、影響度: 中）
5. テスト基盤の構築と主要テストの実装

## 各問題の修正方針

### 1. バックエンドAPI実装計画

#### 問題点の分析
- API仕様書は完成しているが、実装が全くされていない
- ドメインエンティティは実装済み
- データベーススキーマは定義済み

#### 解決方法
Express.jsを使用してRESTful APIサーバーを構築

#### 実装手順

##### Step 1: サーバー基盤の構築
1. src/server.ts - メインサーバーファイル
2. src/app.ts - Expressアプリケーション設定
3. src/config/database.ts - データベース接続設定
4. src/config/redis.ts - Redis接続設定
5. src/config/env.ts - 環境変数設定とバリデーション

##### Step 2: コントローラーの実装
以下のコントローラーを優先順位順に実装：

###### 優先度1（基本機能）
1. **WordsController** (src/controllers/words.controller.ts)
   - 検索・一覧: GET /api/words
   - 詳細取得: GET /api/words/:id
   - 都道府県別統計: GET /api/words/:id/stats

2. **VotesController** (src/controllers/votes.controller.ts)
   - 投票: POST /api/votes
   - 投票取り消し: DELETE /api/votes/:id

3. **RankingController** (src/controllers/ranking.controller.ts)
   - ランキング取得: GET /api/ranking
   - 新着語一覧: GET /api/words/recent

###### 優先度2（ユーザー機能）
4. **AuthController** (src/controllers/auth.controller.ts)
   - サインアップ: POST /api/auth/signup
   - ログイン: POST /api/auth/login
   - ログアウト: POST /api/auth/logout
   - ユーザー情報: GET /api/auth/me

5. **SubmissionsController** (src/controllers/submissions.controller.ts)
   - 新語投稿: POST /api/words

###### 優先度3（管理機能）
6. **AdminController** (src/controllers/admin.controller.ts)
   - 投稿一覧: GET /api/admin/submissions
   - 承認・却下: PUT /api/admin/submissions/:id

7. **StatsController** (src/controllers/stats.controller.ts)
   - サイト統計: GET /api/stats/summary
   - トレンド分析: GET /api/stats/trends

8. **MasterDataController** (src/controllers/master.controller.ts)
   - 都道府県一覧: GET /api/prefectures
   - カテゴリ一覧: GET /api/categories
   - アクセント型一覧: GET /api/accent-types

##### Step 3: ルーティング設定
1. src/routes/index.ts - メインルーター
2. src/routes/words.routes.ts
3. src/routes/votes.routes.ts
4. src/routes/auth.routes.ts
5. src/routes/admin.routes.ts

##### Step 4: サービス層の実装
1. **WordService** (src/services/word.service.ts)
   - 語の検索・取得ロジック
   - モーラ分析統合

2. **VoteService** (src/services/vote.service.ts)
   - 投票ロジック
   - 重複投票チェック
   - 統計更新

3. **StatsService** (src/services/stats.service.ts)
   - 統計集計ロジック
   - キャッシュ管理

4. **AuthService** (src/services/auth.service.ts)
   - 認証・認可ロジック
   - トークン管理

##### Step 5: リポジトリ層の実装
1. **WordRepository** (src/repositories/word.repository.ts)
2. **VoteRepository** (src/repositories/vote.repository.ts)
3. **UserRepository** (src/repositories/user.repository.ts)
4. **StatsRepository** (src/repositories/stats.repository.ts)

### 2. 認証システム統一方針

#### 問題点の分析
- Supabase AuthとカスタムJWT認証が混在
- どちらを使用するか不明確

#### 決定事項
**カスタムJWT認証を採用**

理由：
- より柔軟な制御が可能
- 既存のデータベース設計と親和性が高い
- 独自の認証要件に対応しやすい

#### 実装方針
1. JWT（JSONWebToken）を使用
2. HTTPOnly Cookieでトークンを管理
3. リフレッシュトークンの実装

#### 認証フロー
1. ログイン時：アクセストークン（15分）とリフレッシュトークン（7日）を発行
2. API呼び出し時：アクセストークンを検証
3. 期限切れ時：リフレッシュトークンで自動更新

### 3. テスト実装計画

#### テストフレームワーク
- Jest + Supertest（統合テスト用）

#### 優先的に実装すべきテスト

##### 優先度1（クリティカルパス）
1. **認証テスト** (tests/auth.test.ts)
   - ログイン/ログアウト
   - トークン検証

2. **投票テスト** (tests/vote.test.ts)
   - 正常投票
   - 重複投票防止
   - レート制限

3. **語検索テスト** (tests/word.test.ts)
   - 検索機能
   - 詳細取得

##### 優先度2（主要機能）
4. **新語投稿テスト** (tests/submission.test.ts)
5. **ランキングテスト** (tests/ranking.test.ts)

##### 優先度3（管理機能）
6. **管理者機能テスト** (tests/admin.test.ts)

#### テスト環境構築
1. テスト用データベースの設定
2. モックデータの準備
3. CI/CDパイプラインの設定

### 4. 環境変数管理改善

#### 必要な環境変数一覧

```typescript
// src/config/env.ts
interface EnvironmentVariables {
  // App
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_URL: string;
  
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  
  // Auth
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string; // '15m'
  JWT_REFRESH_EXPIRY: string; // '7d'
  
  // Security
  CORS_ORIGINS: string[];
  RATE_LIMIT_VOTE_PER_HOUR: number;
  RATE_LIMIT_SUBMIT_PER_DAY: number;
  
  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: string;
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
```

#### バリデーション実装
Zodを使用した環境変数のバリデーション

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  // ... その他の定義
});
```

## 実装計画

### フェーズ1: 基盤構築（推定時間: 8時間）
1. サーバー基本設定 - 2時間
2. データベース・Redis接続設定 - 2時間
3. 環境変数管理実装 - 1時間
4. 基本ミドルウェア設定 - 1時間
5. エラーハンドリング設定 - 2時間

### フェーズ2: 主要API実装（推定時間: 16時間）
1. WordsController実装 - 4時間
2. VotesController実装 - 3時間
3. RankingController実装 - 2時間
4. サービス層実装 - 4時間
5. リポジトリ層実装 - 3時間

### フェーズ3: 認証システム実装（推定時間: 8時間）
1. AuthController実装 - 3時間
2. 認証ミドルウェア実装 - 2時間
3. トークン管理実装 - 3時間

### フェーズ4: 管理機能実装（推定時間: 6時間）
1. SubmissionsController実装 - 2時間
2. AdminController実装 - 2時間
3. StatsController実装 - 2時間

### フェーズ5: テスト実装（推定時間: 10時間）
1. テスト環境構築 - 2時間
2. 認証テスト実装 - 2時間
3. 主要機能テスト実装 - 4時間
4. 管理機能テスト実装 - 2時間

**合計推定時間: 48時間（6営業日）**

## リスクと対策

### 技術的リスク
1. **Prismaとの統合複雑性**
   - 対策: Prismaドキュメントの熟読とサンプルコード作成

2. **パフォーマンス問題**
   - 対策: Redis キャッシュの積極活用、インデックス最適化

3. **セキュリティ脆弱性**
   - 対策: OWASP ガイドラインに準拠、セキュリティテストの実施

### スケジュールリスク
1. **予期しない技術的問題**
   - 対策: バッファ時間の確保（20%）

2. **依存関係の問題**
   - 対策: 並行作業可能な部分を明確化

## 次のアクション

1. このレポートの承認を得る
2. フェーズ1の基盤構築から開始
3. 各フェーズ完了時に進捗報告

## 更新履歴

- 2025-08-28: 初版作成