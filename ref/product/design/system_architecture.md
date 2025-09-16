# システムアーキテクチャ設計書

## 1. システム概要

### 1.1 プロジェクト概要
「みんなの投票」は、誰でも簡単に投票に参加でき、SNSで拡散しやすい汎用投票プラットフォームです。既存のアクセント投票機能を含み、時事・エンタメ・雑学など幅広いテーマに対応します。

### 1.2 アーキテクチャの基本方針
- **マイクロサービス指向**: フロントエンドとバックエンドを分離し、RESTful APIで通信
- **スケーラビリティ**: 段階的な負荷増加に対応可能な設計
- **保守性**: モジュール化されたコンポーネント設計により、機能追加・修正が容易
- **セキュリティ**: JWT認証とレート制限による堅牢なセキュリティ
- **リアルタイム性**: 投票結果の即座反映とライブ統計表示

## 2. システム全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Web Browser (PC/Mobile)  │  SNS Apps (X/Instagram/TikTok) │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐ │
│  │   Next.js 14       │   │  │    Share Links              │ │
│  │   - App Router      │   │  │    - Magic Links            │ │
│  │   - SSR/SSG/ISR     │   │  │    - Deep Links             │ │
│  │   - Client Components│   │  │    - Universal Links        │ │
│  └─────────────────────┘   │  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                            HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│                      Vercel Edge                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Rate Limiting │ CORS │ Security Headers │ Compression  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                    Express.js Server                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │   Controllers   │ │   Middleware    │ │   Services    │   │
│  │  - Auth         │ │  - JWT Auth     │ │  - Poll       │   │
│  │  - Polls        │ │  - Validation   │ │  - Vote       │   │
│  │  - Votes        │ │  - Error        │ │  - Stats      │   │
│  │  - Admin        │ │  - Rate Limit   │ │  - Auth       │   │
│  │  - Stats        │ │  - CORS         │ │  - Referral   │   │
│  └─────────────────┘ └─────────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │    Core Tables  │ │   Statistics    │ │   Analytics   │   │
│  │  - Users        │ │  - PollVotes    │ │  - Referrals  │   │
│  │  - Polls        │ │  - VoteStats    │ │  - Trends     │   │
│  │  - Words        │ │  - Aggregates   │ │  - Metrics    │   │
│  │  - Settings     │ │                 │ │               │   │
│  └─────────────────┘ └─────────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 3. 技術スタック詳細

### 3.1 フロントエンド (Client Layer)
| 技術 | バージョン | 役割 | 選定理由 |
|------|-----------|------|----------|
| Next.js | 14.x | React フレームワーク | App Router、SSR/SSG/ISR対応、SEO最適化 |
| React | 18.x | UI ライブラリ | コンポーネント指向、豊富なエコシステム |
| TypeScript | 5.x | 型安全 | 開発効率向上、実行時エラー削減 |
| Tailwind CSS | 3.x | CSS フレームワーク | 高速開発、一貫したデザイン |
| shadcn/ui | latest | UI コンポーネント | アクセシブル、カスタマイズ性 |
| Zustand | 4.x | 状態管理 | 軽量、シンプルAPI |
| React Query | 4.x | サーバー状態管理 | キャッシュ、楽観的更新 |

### 3.2 バックエンド (Application Layer)
| 技術 | バージョン | 役割 | 選定理由 |
|------|-----------|------|----------|
| Node.js | 18+ | ランタイム | JavaScript統一、豊富なライブラリ |
| Express.js | 4.x | Web フレームワーク | 軽量、拡張性、実績 |
| Prisma | 5.x | ORM | 型安全、マイグレーション、開発効率 |
| JWT | - | 認証 | ステートレス、スケーラブル |
| Zod | 3.x | バリデーション | TypeScript連携、実行時型チェック |

### 3.3 データベース (Data Layer)
| 技術 | バージョン | 役割 | 選定理由 |
|------|-----------|------|----------|
| PostgreSQL | 15+ | メインデータベース | ACID準拠、JSON対応、高性能 |
| Redis | 7.x | キャッシュ・セッション | 高速アクセス、永続化対応 |

### 3.4 インフラストラクチャ
| サービス | 役割 | 選定理由 |
|----------|------|----------|
| Vercel | フロントエンドホスティング | 自動デプロイ、CDN、Edge Functions |
| Railway/Supabase | バックエンドホスティング | PostgreSQL統合、スケーリング |
| Cloudflare | CDN・DDoS対策 | グローバル配信、セキュリティ |

## 4. アーキテクチャパターン

### 4.1 レイヤード アーキテクチャ
```
┌─────────────────────────────────────┐
│          Presentation Layer         │ ← Next.js Pages & Components
├─────────────────────────────────────┤
│           API Layer                 │ ← Express.js Routes & Controllers
├─────────────────────────────────────┤
│        Business Logic Layer         │ ← Services & Domain Logic
├─────────────────────────────────────┤
│         Data Access Layer           │ ← Prisma ORM & Repositories
├─────────────────────────────────────┤
│            Data Layer               │ ← PostgreSQL Database
└─────────────────────────────────────┘
```

### 4.2 コンポーネント設計パターン

#### フロントエンド コンポーネント階層
```
App
├── Layout Components
│   ├── Header
│   ├── Navigation
│   ├── Footer
│   └── AdminSidebar
├── Page Components
│   ├── HomePage
│   ├── PollDetailPage
│   ├── StatsPage
│   └── AdminPage
├── Feature Components
│   ├── PollCard
│   ├── VoteForm
│   ├── ResultsChart
│   ├── JapanMap
│   └── AccentPlayer
└── UI Components (shadcn/ui)
    ├── Button
    ├── Dialog
    ├── Form
    └── ...
```

#### バックエンド サービス階層
```
Router Layer
├── /api/auth/*        → AuthController
├── /api/polls/*       → PollsController
├── /api/votes/*       → VotesController
├── /api/stats/*       → StatsController
└── /api/admin/*       → AdminController

Service Layer
├── AuthService        → JWT処理、認証ロジック
├── PollService        → 投票作成、取得、統計
├── VoteService        → 投票記録、重複チェック
├── StatsService       → 統計計算、地図データ生成
└── ReferralService    → 紹介機能、ランキング

Repository Layer
├── UserRepository     → ユーザーデータアクセス
├── PollRepository     → 投票データアクセス
├── VoteRepository     → 投票記録アクセス
└── StatsRepository    → 統計データアクセス
```

## 5. データフロー設計

### 5.1 投票フロー
```
[ユーザー] → [投票ページ] → [属性入力] → [投票送信]
     ↓
[VoteController] → [VoteService] → [重複チェック] → [DB保存]
     ↓
[結果集計] → [統計更新] → [リアルタイム反映] → [ユーザーに結果表示]
```

### 5.2 認証フロー
```
[ログイン要求] → [AuthController] → [認証情報検証]
     ↓
[JWT生成] → [リフレッシュトークン生成] → [Cookieセット]
     ↓
[認証済みセッション] → [保護されたAPI アクセス]
```

### 5.3 統計データフロー
```
[投票データ] → [集計バッチ処理] → [統計テーブル更新]
     ↓
[地図データ生成] → [ランキング更新] → [キャッシュ更新]
     ↓
[API経由でフロントエンドに配信] → [リアルタイム表示]
```

## 6. 非同期処理設計

### 6.1 非同期処理パターン
| 処理 | パターン | 実装方法 | 目的 |
|------|----------|----------|------|
| 投票集計 | 即時処理 | 同期処理 | リアルタイム反映 |
| 統計計算 | バッチ処理 | cron job | 重い計算の効率化 |
| メール送信 | キュー処理 | Redis Queue | 非ブロッキング |
| ファイル生成 | ワーカー処理 | Background Job | UI応答性向上 |

### 6.2 キャッシュ戦略
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Browser Cache  │    │   CDN Cache     │    │  Redis Cache    │
│  (1 hour)       │    │   (24 hours)    │    │  (varies)       │
│                 │    │                 │    │                 │
│ - Static Assets │    │ - Images        │    │ - API responses │
│ - API responses │    │ - API responses │    │ - Session data  │
│ - User prefs    │    │ - Static pages  │    │ - Statistics    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 7. セキュリティアーキテクチャ

### 7.1 セキュリティレイヤー
```
┌─────────────────────────────────────────────────────┐
│                 Client Security                     │
│ - CSP Headers, XSS Protection, Input Validation    │
├─────────────────────────────────────────────────────┤
│               Transport Security                    │
│ - HTTPS/TLS 1.3, HSTS, Certificate Pinning        │
├─────────────────────────────────────────────────────┤
│              Application Security                   │
│ - JWT Authentication, CSRF Protection, CORS        │
├─────────────────────────────────────────────────────┤
│                 Data Security                       │
│ - Database Encryption, PII Protection, Backup     │
└─────────────────────────────────────────────────────┘
```

### 7.2 認証・認可フロー
```
Request → Rate Limiting → CORS → JWT Validation → Role Check → Controller
   │           │           │           │             │            │
   │           │           │           │             │            ▼
   │           │           │           │             │      Business Logic
   │           │           │           │             │            │
   │           │           │           │             │            ▼
   │           │           │           │             │       Data Access
   │           │           │           │             │            │
   ▼           ▼           ▼           ▼             ▼            ▼
Error 429  Error 403   Error 403   Error 401   Error 403    Success 200
```

## 8. スケーラビリティ設計

### 8.1 水平スケーリング戦略
| コンポーネント | スケーリング方法 | 負荷分散 | 制約事項 |
|---------------|------------------|----------|----------|
| Webサーバー | 複数インスタンス | ロードバランサー | セッション共有 |
| データベース | リードレプリカ | 読み取り分散 | 書き込み単一 |
| キャッシュ | Redis Cluster | シャーディング | データ整合性 |
| ファイル | CDN配信 | エッジ配信 | 同期遅延 |

### 8.2 パフォーマンス最適化
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ - Code Split    │    │ - Connection    │    │ - Indexing      │
│ - Lazy Loading  │    │   Pooling       │    │ - Query Opt     │
│ - Tree Shaking  │    │ - Query Opt     │    │ - Partitioning  │
│ - Image Opt     │    │ - Caching       │    │ - Read Replica  │
│ - Bundle Opt    │    │ - Compression   │    │ - Vacuuming     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 9. 監視・ログ設計

### 9.1 監視対象メトリクス
| カテゴリ | メトリクス | 目標値 | アラート閾値 |
|----------|------------|--------|-------------|
| 可用性 | Uptime | 99.9% | < 99% |
| パフォーマンス | API Response Time | < 1s | > 3s |
| エラー率 | Error Rate | < 1% | > 5% |
| リソース | CPU Usage | < 70% | > 90% |
| リソース | Memory Usage | < 80% | > 95% |

### 9.2 ログ設計
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Application    │    │    Structured   │    │   Centralized   │
│     Logs        │────│     Logging     │────│    Storage      │
│                 │    │                 │    │                 │
│ - Access Log    │    │ - JSON Format   │    │ - Log Rotation  │
│ - Error Log     │    │ - Timestamp     │    │ - Retention     │
│ - Audit Log     │    │ - Correlation   │    │ - Search Index  │
│ - Debug Log     │    │ - User Context  │    │ - Alert Rules   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 10. 災害復旧・バックアップ戦略

### 10.1 バックアップ戦略
| データ種別 | バックアップ頻度 | 保持期間 | 復旧時間目標 |
|------------|------------------|----------|-------------|
| データベース | 毎日 | 30日 | 1時間以内 |
| ファイル | 毎日 | 30日 | 1時間以内 |
| 設定 | 変更時 | 永久 | 30分以内 |
| コード | Git管理 | 永久 | 15分以内 |

### 10.2 障害対応フロー
```
障害検知 → 影響度評価 → 対応方針決定 → 緊急対応
    │           │           │           │
    │           │           │           ▼
    │           │           │     一時復旧
    │           │           │           │
    │           │           │           ▼
    │           │           │      根本対応
    │           │           │           │
    │           │           │           ▼
    │           │           │     事後分析
    │           │           │           │
    ▼           ▼           ▼           ▼
 通知      優先度     リソース     改善策
発信       設定       配分        実装
```

## 11. 開発・運用プロセス

### 11.1 CI/CDパイプライン
```
Code Push → Lint/Test → Build → Deploy → Monitor
    │           │         │       │        │
    │           │         │       │        ▼
    │           │         │       │   Performance
    │           │         │       │      Check
    │           │         │       │        │
    │           │         │       ▼        │
    │           │         │    Rollback    │
    │           │         │   (if error)   │
    │           │         │        │       │
    │           ▼         ▼        ▼       ▼
    │      Unit Test   Integration  Production
    │         │           Test        │
    │         │            │          │
    ▼         ▼            ▼          ▼
   ESLint  Jest/RTL    Playwright   Vercel
 TypeCheck  Supertest    E2E Test   Railway
```

### 11.2 環境戦略
| 環境 | 目的 | データ | デプロイ |
|------|------|--------|----------|
| Development | 開発作業 | Mock/Seed | Manual |
| Staging | 本番前検証 | 本番コピー | Auto (PR) |
| Production | 本番運用 | 本番データ | Auto (main) |

## 12. API設計原則

### 12.1 RESTful API設計
```
Resource-based URLs:
GET    /api/polls              # 投票一覧取得
POST   /api/polls              # 投票作成
GET    /api/polls/{id}         # 投票詳細取得
PUT    /api/polls/{id}         # 投票更新
DELETE /api/polls/{id}         # 投票削除
POST   /api/polls/{id}/votes   # 投票記録
```

### 12.2 レスポンス形式統一
```typescript
// 成功レスポンス
{
  success: true,
  data: T,
  meta?: {
    pagination?: PaginationInfo,
    timestamp: string
  }
}

// エラーレスポンス
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## 13. 拡張性設計

### 13.1 プラグインアーキテクチャ
```
Core System
├── Auth Plugin      # 認証プロバイダー拡張
├── Storage Plugin   # ストレージ拡張
├── Analytics Plugin # 分析機能拡張
├── Payment Plugin   # 決済機能拡張
└── AI Plugin        # AI機能拡張
```

### 13.2 将来対応予定機能
- WebSocket による リアルタイム更新
- GraphQL API 対応
- マイクロサービス分割
- Kubernetes 対応
- 多言語対応 (i18n)
- PWA 対応
- 機械学習による 投票予測

## 14. まとめ

本アーキテクチャ設計は以下の特徴を持ちます：

1. **モジュラー設計**: 各コンポーネントが独立し、並行開発が可能
2. **スケーラブル**: 段階的な拡張に対応
3. **セキュア**: 多層防御によるセキュリティ
4. **保守性**: 明確な責任分離と文書化
5. **パフォーマンス**: 適切なキャッシュ戦略とクエリ最適化

これにより、安定性と拡張性を両立した投票プラットフォームの構築が可能です。