# 実装設計書: 日本語アクセント投票サイト

**バージョン**: 1.0  
**最終更新日**: 2025-08-28  
**対象システム**: 日本語アクセント投票サイト

## 1. 概要

本設計書では、日本語アクセント投票サイトの具体的な実装方針とプロジェクト構造を定義します。共同開発を前提とした並列開発可能な設計、モジュール分割、共通処理、エラーハンドリングの詳細を含みます。

## 2. プロジェクト構造設計

### 2.1 ディレクトリ構造

```
accent-vote-site/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── vitest.config.ts
├── playwright.config.ts
│
├── prisma/                          # データベース関連
│   ├── schema.prisma                # Prisma スキーマ定義
│   ├── seed.ts                      # 初期データ投入
│   └── migrations/                  # マイグレーションファイル
│
├── public/                          # 静的ファイル
│   ├── images/
│   │   ├── logo.svg
│   │   └── words/                   # 語のイラスト画像
│   ├── data/
│   │   └── japan-prefectures.json   # 日本地図GeoJSONデータ
│   └── favicon.ico
│
├── src/
│   ├── app/                         # Next.js 14 App Router
│   │   ├── globals.css
│   │   ├── layout.tsx               # ルートレイアウト
│   │   ├── page.tsx                 # トップページ
│   │   ├── not-found.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── api/                     # API Routes
│   │   │   ├── words/
│   │   │   │   ├── route.ts         # GET/POST /api/words
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts     # GET /api/words/[id]
│   │   │   │   │   └── stats/
│   │   │   │   │       └── route.ts # GET /api/words/[id]/stats
│   │   │   │   └── recent/
│   │   │   │       └── route.ts     # GET /api/words/recent
│   │   │   ├── votes/
│   │   │   │   ├── route.ts         # POST /api/votes
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts     # DELETE /api/votes/[id]
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── admin/
│   │   │   │   └── submissions/
│   │   │   │       ├── route.ts
│   │   │   │       └── [id]/route.ts
│   │   │   ├── stats/
│   │   │   │   ├── summary/route.ts
│   │   │   │   └── trends/route.ts
│   │   │   └── prefectures/route.ts
│   │   │
│   │   ├── words/                   # 語関連ページ
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 語詳細ページ
│   │   ├── search/                  # 検索結果ページ
│   │   │   └── page.tsx
│   │   ├── ranking/                 # ランキングページ
│   │   │   └── page.tsx
│   │   ├── recent/                  # 新着語ページ
│   │   │   └── page.tsx
│   │   ├── (auth)/                  # 認証必要ページグループ
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # ユーザーダッシュボード
│   │   │   └── submit/
│   │   │       └── page.tsx         # 新語投稿ページ
│   │   └── admin/                   # 管理者ページ
│   │       ├── layout.tsx
│   │       ├── page.tsx             # 管理者ダッシュボード
│   │       └── submissions/
│   │           └── page.tsx         # 投稿承認ページ
│   │
│   ├── components/                  # React コンポーネント
│   │   ├── ui/                      # 基本UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── index.ts             # 一括エクスポート
│   │   │
│   │   ├── features/                # 機能別コンポーネント
│   │   │   ├── word/                # 語関連コンポーネント
│   │   │   │   ├── WordCard.tsx
│   │   │   │   ├── WordHeader.tsx
│   │   │   │   ├── WordList.tsx
│   │   │   │   └── WordSubmissionForm.tsx
│   │   │   ├── accent/              # アクセント関連コンポーネント
│   │   │   │   ├── AccentCard.tsx
│   │   │   │   ├── AccentPattern.tsx
│   │   │   │   ├── AccentTypeSelector.tsx
│   │   │   │   └── VoteButtons.tsx
│   │   │   ├── search/              # 検索関連コンポーネント
│   │   │   │   ├── SearchBox.tsx
│   │   │   │   ├── SearchFilters.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   └── SearchSuggestions.tsx
│   │   │   ├── stats/               # 統計関連コンポーネント
│   │   │   │   ├── JapanMap.tsx
│   │   │   │   ├── PrefectureChart.tsx
│   │   │   │   ├── RankingTable.tsx
│   │   │   │   └── StatsSummary.tsx
│   │   │   ├── auth/                # 認証関連コンポーネント
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   └── admin/               # 管理者関連コンポーネント
│   │   │       ├── SubmissionList.tsx
│   │   │       ├── SubmissionReview.tsx
│   │   │       ├── UserManagement.tsx
│   │   │       └── SystemStats.tsx
│   │   │
│   │   ├── layout/                  # レイアウトコンポーネント
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   └── common/                  # 共通コンポーネント
│   │       ├── ErrorBoundary.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── DeviceInfo.tsx
│   │
│   ├── hooks/                       # カスタムフック
│   │   ├── api/                     # API関連フック
│   │   │   ├── useWords.ts          # 語関連API
│   │   │   ├── useVotes.ts          # 投票関連API
│   │   │   ├── useStats.ts          # 統計関連API
│   │   │   ├── useAuth.ts           # 認証関連API
│   │   │   └── useAdmin.ts          # 管理者関連API
│   │   ├── useLocalStorage.ts       # ローカルストレージ管理
│   │   ├── useSessionStorage.ts     # セッションストレージ管理
│   │   ├── useDeviceId.ts           # デバイス識別
│   │   ├── useTurnstile.ts          # Cloudflare Turnstile
│   │   ├── useGeolocation.ts        # 位置情報取得
│   │   ├── useDebounce.ts           # デバウンス処理
│   │   ├── useMediaQuery.ts         # レスポンシブ判定
│   │   └── useWebSocket.ts          # WebSocket通信
│   │
│   ├── lib/                         # ライブラリ・ユーティリティ
│   │   ├── api/                     # API関連
│   │   │   ├── client.ts            # APIクライアント設定
│   │   │   ├── endpoints.ts         # エンドポイント定義
│   │   │   └── types.ts             # API型定義
│   │   ├── db/                      # データベース関連
│   │   │   ├── connection.ts        # DB接続設定
│   │   │   ├── prisma.ts            # Prismaクライアント
│   │   │   └── seed/                # シードデータ
│   │   │       ├── prefectures.ts
│   │   │       ├── categories.ts
│   │   │       └── sample-words.ts
│   │   ├── cache/                   # キャッシュ関連
│   │   │   ├── redis.ts             # Redis接続・操作
│   │   │   ├── memory.ts            # インメモリキャッシュ
│   │   │   └── strategy.ts          # キャッシュ戦略
│   │   ├── auth/                    # 認証関連
│   │   │   ├── supabase.ts          # Supabase設定
│   │   │   ├── jwt.ts               # JWT処理
│   │   │   └── middleware.ts        # 認証ミドルウェア
│   │   ├── validation/              # バリデーション
│   │   │   ├── schemas.ts           # Zodスキーマ定義
│   │   │   ├── word.ts              # 語関連バリデーション
│   │   │   ├── vote.ts              # 投票関連バリデーション
│   │   │   └── auth.ts              # 認証関連バリデーション
│   │   ├── utils/                   # ユーティリティ関数
│   │   │   ├── mora.ts              # モーラ分割処理
│   │   │   ├── accent.ts            # アクセント型処理
│   │   │   ├── date.ts              # 日付処理
│   │   │   ├── format.ts            # フォーマット処理
│   │   │   ├── constants.ts         # 定数定義
│   │   │   └── helpers.ts           # ヘルパー関数
│   │   ├── security/                # セキュリティ関連
│   │   │   ├── turnstile.ts         # Turnstile検証
│   │   │   ├── rateLimit.ts         # レート制限
│   │   │   ├── csrf.ts              # CSRF対策
│   │   │   └── sanitize.ts          # データサニタイズ
│   │   └── monitoring/              # 監視・ログ関連
│   │       ├── logger.ts            # ログ設定
│   │       ├── metrics.ts           # メトリクス収集
│   │       └── tracing.ts           # 分散トレーシング
│   │
│   ├── services/                    # ビジネスロジックサービス
│   │   ├── WordService.ts           # 語関連ビジネスロジック
│   │   ├── VoteService.ts           # 投票関連ビジネスロジック
│   │   ├── StatisticsService.ts     # 統計関連ビジネスロジック
│   │   ├── AuthenticationService.ts # 認証関連ビジネスロジック
│   │   ├── AdminService.ts          # 管理者関連ビジネスロジック
│   │   └── EmailService.ts          # メール送信サービス
│   │
│   ├── repositories/                # データアクセス層
│   │   ├── interfaces/              # リポジトリインターフェース
│   │   │   ├── IWordRepository.ts
│   │   │   ├── IVoteRepository.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── ISubmissionRepository.ts
│   │   ├── impl/                    # 実装クラス
│   │   │   ├── PrismaWordRepository.ts
│   │   │   ├── PrismaVoteRepository.ts
│   │   │   ├── PrismaUserRepository.ts
│   │   │   └── PrismaSubmissionRepository.ts
│   │   └── base/                    # ベースクラス
│   │       └── BaseRepository.ts
│   │
│   ├── store/                       # 状態管理
│   │   ├── authStore.ts             # 認証状態管理
│   │   ├── voteStore.ts             # 投票状態管理
│   │   ├── uiStore.ts               # UI状態管理
│   │   └── searchStore.ts           # 検索状態管理
│   │
│   ├── types/                       # TypeScript型定義
│   │   ├── api.ts                   # API関連型
│   │   ├── domain/                  # ドメインモデル型
│   │   │   ├── word.ts
│   │   │   ├── vote.ts
│   │   │   ├── user.ts
│   │   │   └── statistics.ts
│   │   ├── database.ts              # データベース型
│   │   ├── ui.ts                    # UI関連型
│   │   └── global.d.ts              # グローバル型定義
│   │
│   └── styles/                      # スタイル関連
│       ├── globals.css              # グローバルスタイル
│       ├── components.css           # コンポーネント固有スタイル
│       └── themes/                  # テーマ定義
│           ├── default.css
│           └── echarts.ts           # EChartsテーマ設定
│
├── tests/                           # テストファイル
│   ├── __mocks__/                   # モックファイル
│   ├── unit/                        # ユニットテスト
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                 # 統合テスト
│   │   ├── api/
│   │   └── database/
│   ├── e2e/                         # E2Eテスト（Playwright）
│   │   ├── vote-flow.spec.ts
│   │   ├── submission-flow.spec.ts
│   │   └── admin-flow.spec.ts
│   └── setup/                       # テスト設定
│       ├── jest.setup.ts
│       └── test-utils.tsx
│
├── docs/                            # ドキュメント
│   ├── api.md                       # API仕様書
│   ├── deployment.md                # デプロイメントガイド
│   ├── development.md               # 開発ガイド
│   └── troubleshooting.md           # トラブルシューティング
│
└── scripts/                         # 運用スクリプト
    ├── build.sh                     # ビルドスクリプト
    ├── deploy.sh                    # デプロイスクリプト
    ├── backup.sh                    # バックアップスクリプト
    └── seed-database.ts             # データベース初期化スクリプト
```

## 3. モジュール分割と依存関係

### 3.1 レイヤードアーキテクチャの実装

```typescript
// src/types/architecture.ts - アーキテクチャ制約を型で表現
export interface LayeredArchitecture {
  // プレゼンテーション層：他の層への依存は許可しない
  presentation: {
    components: ComponentModule[];
    pages: PageModule[];
    hooks: HookModule[];
  };
  
  // アプリケーション層：ドメイン層とインフラ層に依存可能
  application: {
    services: ServiceModule[];
    useCases: UseCaseModule[];
  };
  
  // ドメイン層：他の層への依存は禁止
  domain: {
    entities: EntityModule[];
    valueObjects: ValueObjectModule[];
    repositories: RepositoryInterfaceModule[];
  };
  
  // インフラ層：全ての層に依存可能
  infrastructure: {
    repositories: RepositoryImplModule[];
    externalServices: ExternalServiceModule[];
    databases: DatabaseModule[];
  };
}
```

### 3.2 モジュール境界の定義

```typescript
// src/modules/word/index.ts - 語モジュールの公開API
export { WordService } from './services/WordService';
export { Word, WordId } from './domain/Word';
export { IWordRepository } from './repositories/IWordRepository';
export type { WordResponse, CreateWordRequest } from './types';

// プライベートな実装は非公開
// export { PrismaWordRepository } from './repositories/impl/PrismaWordRepository'; // ❌
```

```typescript
// src/modules/vote/index.ts - 投票モジュールの公開API
export { VoteService } from './services/VoteService';
export { Vote, VoteId, DeviceId } from './domain/Vote';
export { IVoteRepository } from './repositories/IVoteRepository';
export type { VoteRequest, VoteResponse } from './types';
```

```typescript
// src/modules/statistics/index.ts - 統計モジュールの公開API
export { StatisticsService } from './services/StatisticsService';
export { WordStatistics } from './domain/Statistics';
export type { StatsResponse, RankingResponse } from './types';
```

### 3.3 並列開発のための依存関係管理

```typescript
// src/lib/di/container.ts - 依存性注入コンテナ
export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();
  
  static getInstance(): DIContainer {
    if (!this.instance) {
      this.instance = new DIContainer();
    }
    return this.instance;
  }
  
  register<T>(key: string, implementation: T): void {
    this.services.set(key, implementation);
  }
  
  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return service;
  }
}

// 並列開発用のモック実装
export class MockWordService implements IWordService {
  async searchWords(query: SearchQuery): Promise<SearchResult> {
    // モック実装
    return {
      words: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }
  
  async getWordDetail(id: WordId): Promise<WordDetail> {
    // モック実装
    return {
      id: id.value,
      headword: 'サンプル',
      reading: 'サンプル',
      // ...
    };
  }
}

// 開発環境での依存関係設定
if (process.env.NODE_ENV === 'development') {
  const container = DIContainer.getInstance();
  container.register('WordService', new MockWordService());
  container.register('VoteService', new MockVoteService());
  // ...
}
```

## 4. 各モジュールの実装方針

### 4.1 語（Word）モジュール

#### 4.1.1 ドメインモデル実装

```typescript
// src/modules/word/domain/Word.ts
export class Word {
  private constructor(
    private _id: WordId,
    private _headword: string,
    private _reading: string,
    private _category: WordCategory,
    private _moraCount: number,
    private _moraSegments: string[],
    private _status: WordStatus,
    private _aliases: string[],
    private _submittedBy?: UserId,
    private _approvedBy?: UserId,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // Factory Methods
  static create(props: CreateWordProps): Word {
    const moraAnalyzer = new MoraAnalyzer();
    const moraSegments = moraAnalyzer.splitIntoMora(props.reading);
    
    return new Word(
      WordId.generate(),
      props.headword,
      props.reading,
      props.category,
      moraSegments.length,
      moraSegments,
      WordStatus.PENDING,
      props.aliases || [],
      props.submittedBy
    );
  }

  static fromPersistence(data: WordPersistenceData): Word {
    return new Word(
      new WordId(data.id),
      data.headword,
      data.reading,
      data.category as WordCategory,
      data.mora_count,
      data.mora_segments as string[],
      data.status as WordStatus,
      data.aliases || [],
      data.submitted_by ? new UserId(data.submitted_by) : undefined,
      data.approved_by ? new UserId(data.approved_by) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  // Business Logic
  approve(approvedBy: UserId): DomainEvent[] {
    if (this._status !== WordStatus.PENDING) {
      throw new DomainError('Only pending words can be approved');
    }
    
    this._status = WordStatus.APPROVED;
    this._approvedBy = approvedBy;
    this._updatedAt = new Date();
    
    return [
      new WordApprovedEvent(this._id, approvedBy, this._updatedAt)
    ];
  }

  // Getters with business logic
  get canBeVotedOn(): boolean {
    return this._status === WordStatus.APPROVED;
  }

  get displayReading(): string {
    return this._reading; // 将来的にカタカナ変換などの処理を追加可能
  }

  // データ変換メソッド
  toPersistence(): WordPersistenceData {
    return {
      id: this._id.value,
      headword: this._headword,
      reading: this._reading,
      category: this._category,
      mora_count: this._moraCount,
      mora_segments: this._moraSegments,
      status: this._status,
      aliases: this._aliases,
      submitted_by: this._submittedBy?.value,
      approved_by: this._approvedBy?.value,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  toResponse(): WordResponse {
    return {
      id: this._id.value,
      headword: this._headword,
      reading: this._reading,
      category: this._category,
      moraCount: this._moraCount,
      moraSegments: [...this._moraSegments],
      aliases: [...this._aliases],
      createdAt: this._createdAt.toISOString()
    };
  }
}
```

#### 4.1.2 リポジトリ実装

```typescript
// src/modules/word/repositories/impl/PrismaWordRepository.ts
export class PrismaWordRepository implements IWordRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: WordId): Promise<Word | null> {
    const data = await this.prisma.word.findUnique({
      where: { id: id.value },
      include: {
        category: true,
        aliases: true
      }
    });

    return data ? Word.fromPersistence(this.mapPrismaToWord(data)) : null;
  }

  async searchWords(query: SearchWordsQuery): Promise<Word[]> {
    const whereClause = this.buildSearchWhereClause(query);
    const orderBy = this.buildOrderByClause(query.sort);

    const data = await this.prisma.word.findMany({
      where: whereClause,
      include: {
        category: true,
        aliases: true,
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit
    });

    return data.map(item => Word.fromPersistence(this.mapPrismaToWord(item)));
  }

  async save(word: Word): Promise<Word> {
    const data = word.toPersistence();
    
    const saved = await this.prisma.word.upsert({
      where: { id: data.id },
      create: {
        headword: data.headword,
        reading: data.reading,
        category_id: await this.getCategoryId(data.category),
        mora_count: data.mora_count,
        mora_segments: data.mora_segments,
        status: data.status,
        submitted_by: data.submitted_by,
        approved_by: data.approved_by,
        aliases: {
          create: data.aliases?.map(alias => ({ alias })) || []
        }
      },
      update: {
        headword: data.headword,
        reading: data.reading,
        status: data.status,
        approved_by: data.approved_by,
        updated_at: data.updated_at
      },
      include: {
        category: true,
        aliases: true
      }
    });

    return Word.fromPersistence(this.mapPrismaToWord(saved));
  }

  private buildSearchWhereClause(query: SearchWordsQuery): Prisma.WordWhereInput {
    const conditions: Prisma.WordWhereInput[] = [
      { status: 'approved' }
    ];

    if (query.q) {
      conditions.push({
        OR: [
          { headword: { contains: query.q, mode: 'insensitive' } },
          { reading: { contains: query.q, mode: 'insensitive' } },
          {
            aliases: {
              some: {
                alias: { contains: query.q, mode: 'insensitive' }
              }
            }
          }
        ]
      });
    }

    if (query.category) {
      conditions.push({
        category: {
          name: query.category
        }
      });
    }

    return { AND: conditions };
  }

  private buildOrderByClause(sort?: string): Prisma.WordOrderByWithRelationInput[] {
    switch (sort) {
      case 'latest':
        return [{ created_at: 'desc' }];
      case 'alphabetic':
        return [{ headword: 'asc' }];
      case 'popular':
      default:
        return [
          { votes: { _count: 'desc' } },
          { created_at: 'desc' }
        ];
    }
  }

  private async getCategoryId(categoryName: string): Promise<number> {
    const category = await this.prisma.wordCategory.findUnique({
      where: { name: categoryName }
    });
    
    if (!category) {
      throw new Error(`Category ${categoryName} not found`);
    }
    
    return category.id;
  }

  private mapPrismaToWord(data: any): WordPersistenceData {
    return {
      id: data.id,
      headword: data.headword,
      reading: data.reading,
      category: data.category.name,
      mora_count: data.mora_count,
      mora_segments: data.mora_segments,
      status: data.status,
      aliases: data.aliases?.map((a: any) => a.alias) || [],
      submitted_by: data.submitted_by,
      approved_by: data.approved_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}
```

#### 4.1.3 サービス実装

```typescript
// src/modules/word/services/WordService.ts
export class WordService {
  constructor(
    private wordRepository: IWordRepository,
    private submissionRepository: ISubmissionRepository,
    private cacheService: ICacheService,
    private eventDispatcher: IEventDispatcher,
    private logger: ILogger
  ) {}

  @CacheResult('word:search', 300) // 5分間キャッシュ
  @RateLimit('search', 60, 60000) // 1分間に60回まで
  async searchWords(query: SearchWordsQuery): Promise<SearchWordsResult> {
    this.logger.info('Word search started', { query });
    
    try {
      // バリデーション
      const validatedQuery = await this.validateSearchQuery(query);
      
      // 検索実行
      const words = await this.wordRepository.searchWords(validatedQuery);
      
      // 統計情報を並列で取得
      const wordsWithStats = await this.enrichWordsWithStats(words);
      
      // ページネーション処理
      const result = this.paginateResults(wordsWithStats, query);
      
      this.logger.info('Word search completed', { 
        query, 
        resultCount: result.words.length,
        totalResults: result.pagination.total 
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Word search failed', { query, error });
      throw error;
    }
  }

  @Transactional()
  async submitNewWord(request: SubmitWordRequest): Promise<SubmitWordResult> {
    this.logger.info('New word submission started', { 
      headword: request.headword,
      submittedBy: request.submittedBy 
    });

    try {
      // バリデーション
      await this.validateWordSubmission(request);

      // 重複チェック
      const duplicates = await this.checkForDuplicates(request);
      if (duplicates.length > 0) {
        return {
          status: 'duplicate_found',
          duplicates: duplicates.map(w => w.toResponse())
        };
      }

      // 新語作成
      const word = Word.create({
        headword: request.headword,
        reading: request.reading,
        category: request.category,
        aliases: request.aliases,
        submittedBy: new UserId(request.submittedBy)
      });

      // 保存
      const savedWord = await this.wordRepository.save(word);

      // イベント発行
      await this.eventDispatcher.dispatch(
        new WordSubmittedEvent(savedWord.id, new UserId(request.submittedBy))
      );

      // 関連キャッシュ無効化
      await this.invalidateRelatedCaches();

      this.logger.info('New word submission completed', { 
        wordId: savedWord.id.value,
        headword: request.headword 
      });

      return {
        status: 'submitted',
        wordId: savedWord.id.value,
        estimatedReviewTime: this.calculateEstimatedReviewTime()
      };

    } catch (error) {
      this.logger.error('New word submission failed', { request, error });
      throw error;
    }
  }

  @RequiresRole(['admin', 'moderator'])
  @Transactional()
  async approveWord(wordId: WordId, approvedBy: UserId): Promise<void> {
    this.logger.info('Word approval started', { wordId: wordId.value, approvedBy: approvedBy.value });

    try {
      const word = await this.wordRepository.findById(wordId);
      if (!word) {
        throw new NotFoundError('Word not found');
      }

      // 承認処理
      const events = word.approve(approvedBy);
      await this.wordRepository.save(word);

      // イベント処理
      for (const event of events) {
        await this.eventDispatcher.dispatch(event);
      }

      // アクセント型オプション生成
      await this.generateAccentOptions(word);

      // キャッシュ無効化
      await this.invalidateRelatedCaches();

      this.logger.info('Word approval completed', { wordId: wordId.value });

    } catch (error) {
      this.logger.error('Word approval failed', { wordId: wordId.value, error });
      throw error;
    }
  }

  private async validateSearchQuery(query: SearchWordsQuery): Promise<SearchWordsQuery> {
    const schema = SearchQuerySchema;
    return schema.parse(query);
  }

  private async enrichWordsWithStats(words: Word[]): Promise<WordWithStats[]> {
    // 統計情報を並列で取得して効率化
    const statsPromises = words.map(async (word) => {
      const [voteCount, prefectureCount] = await Promise.all([
        this.getVoteCount(word.id),
        this.getPrefectureCount(word.id)
      ]);

      return {
        ...word.toResponse(),
        totalVotes: voteCount,
        prefectureCount: prefectureCount
      };
    });

    return Promise.all(statsPromises);
  }

  private async invalidateRelatedCaches(): Promise<void> {
    const patterns = [
      'word:search:*',
      'ranking:*',
      'stats:summary',
      'recent:words'
    ];

    await Promise.all(
      patterns.map(pattern => this.cacheService.deletePattern(pattern))
    );
  }
}
```

### 4.2 投票（Vote）モジュール

#### 4.2.1 投票処理の実装

```typescript
// src/modules/vote/services/VoteService.ts
export class VoteService {
  constructor(
    private voteRepository: IVoteRepository,
    private deviceRepository: IDeviceRepository,
    private statisticsService: IStatisticsService,
    private securityService: ISecurityService,
    private eventDispatcher: IEventDispatcher,
    private logger: ILogger
  ) {}

  @RateLimit('vote', 10, 3600000) // 1時間に10回まで
  @ValidateTurnstile()
  @Transactional()
  async submitVote(request: SubmitVoteRequest): Promise<VoteResult> {
    const startTime = Date.now();
    
    this.logger.info('Vote submission started', {
      wordId: request.wordId,
      accentType: request.accentType,
      prefecture: request.prefecture,
      deviceFingerprint: request.deviceFingerprint?.substring(0, 8) // セキュリティのため一部のみログ
    });

    try {
      // セキュリティチェック
      await this.securityService.validateVoteRequest(request);

      // デバイス取得・生成
      const device = await this.getOrCreateDevice(request.deviceFingerprint);

      // 重複投票チェック
      await this.checkDuplicateVote(device.id, new WordId(request.wordId));

      // 投票作成
      const vote = Vote.create({
        wordId: new WordId(request.wordId),
        accentType: request.accentType,
        deviceId: device.id,
        prefecture: request.prefecture,
        ageGroup: request.ageGroup
      });

      // 保存と統計更新を同一トランザクションで実行
      const savedVote = await this.voteRepository.save(vote);
      await this.statisticsService.updateStatistics(savedVote);

      // イベント発行
      await this.eventDispatcher.dispatch(
        new VoteSubmittedEvent(savedVote.id, savedVote.wordId, savedVote.accentType)
      );

      // 統計データ取得（レスポンス用）
      const updatedStats = await this.statisticsService.getWordStatistics(savedVote.wordId);

      const processingTime = Date.now() - startTime;
      this.logger.info('Vote submission completed', {
        voteId: savedVote.id.value,
        wordId: request.wordId,
        processingTime
      });

      return {
        voteId: savedVote.id.value,
        wordId: request.wordId,
        accentType: request.accentType,
        canUndo: true,
        undoExpiresAt: new Date(Date.now() + 5000).toISOString(),
        updatedStats: {
          national: updatedStats.nationalStats,
          prefecture: updatedStats.getPrefectureStats(request.prefecture)
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Vote submission failed', {
        wordId: request.wordId,
        error: error.message,
        processingTime
      });
      
      throw error;
    }
  }

  @Transactional()
  async undoVote(voteId: VoteId, deviceId: DeviceId): Promise<UndoResult> {
    this.logger.info('Vote undo started', { voteId: voteId.value });

    try {
      const vote = await this.voteRepository.findById(voteId);
      if (!vote) {
        throw new NotFoundError('Vote not found');
      }

      // アンドゥ可能性チェック
      if (!vote.canBeUndoneBy(deviceId, new Date())) {
        throw new BusinessRuleError('Vote cannot be undone');
      }

      // 投票削除と統計更新
      await this.voteRepository.delete(voteId);
      await this.statisticsService.subtractVote(vote);

      // イベント発行
      await this.eventDispatcher.dispatch(
        new VoteUndoneEvent(voteId, vote.wordId)
      );

      // 更新された統計データ取得
      const updatedStats = await this.statisticsService.getWordStatistics(vote.wordId);

      this.logger.info('Vote undo completed', { voteId: voteId.value });

      return {
        success: true,
        message: 'Vote successfully undone',
        updatedStats: {
          national: updatedStats.nationalStats,
          prefecture: updatedStats.getPrefectureStats(vote.prefecture)
        }
      };

    } catch (error) {
      this.logger.error('Vote undo failed', { voteId: voteId.value, error });
      throw error;
    }
  }

  private async checkDuplicateVote(deviceId: DeviceId, wordId: WordId): Promise<void> {
    const existingVote = await this.voteRepository.findByDeviceAndWord(deviceId, wordId);
    
    if (existingVote && existingVote.isWithin24Hours(new Date())) {
      const remainingTime = this.calculateRemainingTime(existingVote.votedAt);
      throw new DuplicateVoteError(
        'Already voted for this word within 24 hours',
        remainingTime
      );
    }

    // 既存の投票がある場合は削除（24時間経過後の再投票）
    if (existingVote) {
      await this.voteRepository.delete(existingVote.id);
      await this.statisticsService.subtractVote(existingVote);
    }
  }

  private async getOrCreateDevice(fingerprint: string): Promise<Device> {
    let device = await this.deviceRepository.findByFingerprint(fingerprint);
    
    if (!device) {
      device = Device.create(fingerprint);
      device = await this.deviceRepository.save(device);
      
      this.logger.info('New device created', { 
        deviceId: device.id.value,
        fingerprint: fingerprint.substring(0, 8) 
      });
    } else {
      // 最終確認日時更新
      device.updateLastSeen();
      await this.deviceRepository.save(device);
    }

    return device;
  }

  private calculateRemainingTime(votedAt: Date): number {
    const now = new Date();
    const votedTime = votedAt.getTime();
    const remainingMs = (24 * 60 * 60 * 1000) - (now.getTime() - votedTime);
    return Math.max(0, remainingMs);
  }
}
```

### 4.3 統計（Statistics）モジュール

#### 4.3.1 統計計算エンジン

```typescript
// src/modules/statistics/services/StatisticsService.ts
export class StatisticsService {
  constructor(
    private statisticsRepository: IStatisticsRepository,
    private cacheService: ICacheService,
    private logger: ILogger
  ) {}

  @CacheResult('word:stats', 300) // 5分間キャッシュ
  async getWordStatistics(wordId: WordId): Promise<WordStatistics> {
    this.logger.debug('Getting word statistics', { wordId: wordId.value });

    try {
      // 国別統計取得
      const nationalStats = await this.statisticsRepository.getNationalStats(wordId);
      
      // 都道府県別統計取得
      const prefectureStats = await this.statisticsRepository.getPrefectureStats(wordId);

      // 統計オブジェクト構築
      const statistics = WordStatistics.create(wordId, nationalStats, prefectureStats);

      this.logger.debug('Word statistics retrieved', {
        wordId: wordId.value,
        totalVotes: statistics.totalVotes,
        prefectureCount: statistics.activePrefectures
      });

      return statistics;

    } catch (error) {
      this.logger.error('Failed to get word statistics', { wordId: wordId.value, error });
      throw error;
    }
  }

  @Transactional()
  async updateStatistics(vote: Vote): Promise<void> {
    const startTime = Date.now();
    
    this.logger.debug('Updating statistics for vote', {
      voteId: vote.id.value,
      wordId: vote.wordId.value,
      accentType: vote.accentType,
      prefecture: vote.prefecture
    });

    try {
      // 都道府県別統計更新
      await this.updatePrefectureStatistics(vote);
      
      // 全国統計更新
      await this.updateNationalStatistics(vote);
      
      // 関連キャッシュ無効化
      await this.invalidateStatisticsCache(vote.wordId);
      
      const processingTime = Date.now() - startTime;
      this.logger.debug('Statistics update completed', {
        voteId: vote.id.value,
        processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Statistics update failed', {
        voteId: vote.id.value,
        error,
        processingTime
      });
      throw error;
    }
  }

  @Transactional()
  async subtractVote(vote: Vote): Promise<void> {
    this.logger.debug('Subtracting vote from statistics', {
      voteId: vote.id.value,
      wordId: vote.wordId.value
    });

    try {
      // 都道府県別統計から減算
      await this.subtractFromPrefectureStats(vote);
      
      // 全国統計から減算
      await this.subtractFromNationalStats(vote);
      
      // キャッシュ無効化
      await this.invalidateStatisticsCache(vote.wordId);
      
      this.logger.debug('Vote subtraction completed', { voteId: vote.id.value });

    } catch (error) {
      this.logger.error('Vote subtraction failed', { voteId: vote.id.value, error });
      throw error;
    }
  }

  @CacheResult('ranking', 1800) // 30分間キャッシュ
  async getRanking(period: RankingPeriod, limit: number = 50): Promise<RankingResult> {
    this.logger.debug('Getting ranking', { period, limit });

    try {
      const rankingData = await this.statisticsRepository.getRanking(period, limit);
      
      // ランキング変動計算
      const previousRanking = await this.getPreviousRanking(period);
      const rankingWithChanges = this.calculateRankingChanges(rankingData, previousRanking);

      this.logger.debug('Ranking retrieved', { 
        period, 
        itemCount: rankingWithChanges.length 
      });

      return {
        period,
        rankings: rankingWithChanges,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get ranking', { period, error });
      throw error;
    }
  }

  private async updatePrefectureStatistics(vote: Vote): Promise<void> {
    // アトミックな統計更新のためのUPSERT処理
    await this.statisticsRepository.upsertPrefectureStats({
      wordId: vote.wordId,
      prefecture: vote.prefecture,
      accentType: vote.accentType,
      increment: 1
    });

    // パーセンテージ再計算
    await this.recalculatePrefecturePercentages(vote.wordId, vote.prefecture);
  }

  private async updateNationalStatistics(vote: Vote): Promise<void> {
    // 全国統計更新
    await this.statisticsRepository.upsertNationalStats({
      wordId: vote.wordId,
      accentType: vote.accentType,
      increment: 1
    });

    // パーセンテージ再計算
    await this.recalculateNationalPercentages(vote.wordId);
  }

  private async recalculatePrefecturePercentages(wordId: WordId, prefecture: Prefecture): Promise<void> {
    // その県でのその語の総投票数を取得
    const totalVotes = await this.statisticsRepository.getTotalVotesForWordInPrefecture(wordId, prefecture);
    
    if (totalVotes === 0) return;

    // 各アクセント型の投票数とパーセンテージを更新
    const accentStats = await this.statisticsRepository.getPrefectureStatsForWord(wordId, prefecture);
    
    for (const stat of accentStats) {
      const percentage = (stat.voteCount / totalVotes) * 100;
      await this.statisticsRepository.updatePrefectureStatsPercentage({
        wordId,
        prefecture,
        accentType: stat.accentType,
        percentage: Math.round(percentage * 100) / 100, // 小数点第2位まで
        totalVotes
      });
    }
  }

  private async recalculateNationalPercentages(wordId: WordId): Promise<void> {
    // 全国総投票数取得
    const totalVotes = await this.statisticsRepository.getTotalVotesForWord(wordId);
    
    if (totalVotes === 0) return;

    // 各アクセント型の統計更新
    const accentStats = await this.statisticsRepository.getNationalStatsForWord(wordId);
    
    for (const stat of accentStats) {
      const percentage = (stat.voteCount / totalVotes) * 100;
      await this.statisticsRepository.updateNationalStatsPercentage({
        wordId,
        accentType: stat.accentType,
        percentage: Math.round(percentage * 100) / 100,
        totalVotes
      });
    }
  }

  private async invalidateStatisticsCache(wordId: WordId): Promise<void> {
    const patterns = [
      `word:stats:${wordId.value}`,
      'ranking:*',
      'stats:summary',
      'trends:*'
    ];

    await Promise.all(
      patterns.map(pattern => this.cacheService.deletePattern(pattern))
    );
  }

  private calculateRankingChanges(
    current: RankingItem[], 
    previous: RankingItem[]
  ): RankingItemWithChange[] {
    const previousMap = new Map(previous.map(item => [item.wordId, item.rank]));

    return current.map((item, index) => {
      const currentRank = index + 1;
      const previousRank = previousMap.get(item.wordId);
      
      let rankChange: number | null = null;
      if (previousRank !== undefined) {
        rankChange = previousRank - currentRank; // 正の値は上昇、負の値は下降
      }

      return {
        ...item,
        rank: currentRank,
        rankChange
      };
    });
  }
}
```

## 5. 共通処理の設計

### 5.1 エラーハンドリング統一設計

```typescript
// src/lib/errors/ErrorHandler.ts
export class GlobalErrorHandler {
  private logger: ILogger;
  private notificationService: INotificationService;

  constructor(logger: ILogger, notificationService: INotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
  }

  handleError(error: Error, context: ErrorContext): ErrorResponse {
    // エラー分類
    const errorType = this.classifyError(error);
    
    // ログ記録
    this.logError(error, context, errorType);
    
    // 通知処理（重要なエラーのみ）
    if (this.isCriticalError(errorType)) {
      this.notificationService.notifyError(error, context);
    }

    // クライアント向けレスポンス生成
    return this.formatErrorResponse(error, errorType);
  }

  private classifyError(error: Error): ErrorType {
    if (error instanceof ValidationError) return ErrorType.VALIDATION;
    if (error instanceof NotFoundError) return ErrorType.NOT_FOUND;
    if (error instanceof BusinessRuleError) return ErrorType.BUSINESS_RULE;
    if (error instanceof SecurityError) return ErrorType.SECURITY;
    if (error instanceof RateLimitError) return ErrorType.RATE_LIMIT;
    if (error instanceof ExternalServiceError) return ErrorType.EXTERNAL_SERVICE;
    
    return ErrorType.INTERNAL_SERVER;
  }

  private logError(error: Error, context: ErrorContext, type: ErrorType): void {
    const logLevel = this.getLogLevel(type);
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      type,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      userId: context.userId,
      ipAddress: context.ipAddress
    };

    switch (logLevel) {
      case 'error':
        this.logger.error('Error occurred', logData);
        break;
      case 'warn':
        this.logger.warn('Warning occurred', logData);
        break;
      case 'info':
        this.logger.info('Info level error', logData);
        break;
    }
  }

  private formatErrorResponse(error: Error, type: ErrorType): ErrorResponse {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      success: false,
      error: {
        code: this.getErrorCode(type),
        message: this.getUserFriendlyMessage(error, type),
        details: isDevelopment ? {
          originalMessage: error.message,
          stack: error.stack
        } : undefined
      }
    };
  }

  private getUserFriendlyMessage(error: Error, type: ErrorType): string {
    // ユーザー向けのエラーメッセージマッピング
    const messageMap = {
      [ErrorType.VALIDATION]: 'ǦΗ力内容を確認してください。',
      [ErrorType.NOT_FOUND]: 'お探しの項目が見つかりませんでした。',
      [ErrorType.BUSINESS_RULE]: error.message, // ビジネスルールエラーはそのまま表示
      [ErrorType.SECURITY]: 'セキュリティエラーが発生しました。',
      [ErrorType.RATE_LIMIT]: 'アクセス制限に達しました。しばらく時間をおいて再度お試しください。',
      [ErrorType.EXTERNAL_SERVICE]: '外部サービスとの通信でエラーが発生しました。',
      [ErrorType.INTERNAL_SERVER]: 'サーバーエラーが発生しました。管理者にお問い合わせください。'
    };

    return messageMap[type] || messageMap[ErrorType.INTERNAL_SERVER];
  }
}

// Next.js API Routes でのエラーハンドリング適用
export function withErrorHandling(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      const errorHandler = new GlobalErrorHandler(
        Logger.getInstance(),
        NotificationService.getInstance()
      );

      const context: ErrorContext = {
        requestId: req.headers['x-request-id'] as string || generateRequestId(),
        method: req.method!,
        url: req.url!,
        userId: (req as any).user?.id,
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const errorResponse = errorHandler.handleError(error as Error, context);
      const statusCode = this.getStatusCodeFromError(error);

      res.status(statusCode).json(errorResponse);
    }
  };
}
```

### 5.2 バリデーション統一設計

```typescript
// src/lib/validation/BaseValidator.ts
export abstract class BaseValidator<T> {
  abstract schema: z.ZodSchema<T>;
  
  async validate(data: unknown): Promise<T> {
    try {
      return await this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Validation failed',
          this.formatZodErrors(error)
        );
      }
      throw error;
    }
  }

  private formatZodErrors(error: z.ZodError): ValidationErrorDetails[] {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      value: err.input
    }));
  }
}

// 語関連バリデーション
export class WordValidator extends BaseValidator<WordSubmissionData> {
  schema = z.object({
    headword: z.string()
      .min(1, '見出し語は必須です')
      .max(30, '見出し語は30文字以内で入力してください')
      .regex(/^[ひらがなカタカナ漢字々〆]+$/, '見出し語は日本語文字のみ使用可能です'),
    
    reading: z.string()
      .min(1, '読みは必須です')
      .max(50, '読みは50文字以内で入力してください')
      .regex(/^[ァ-ヶー]+$/, '読みはカタカナのみ使用可能です')
      .transform(reading => {
        // ひらがなをカタカナに変換
        return reading.replace(/[\u3041-\u3096]/g, (match) => 
          String.fromCharCode(match.charCodeAt(0) + 0x60)
        );
      }),
    
    category: z.enum(['一般語', '専門語', '方言', '固有名詞'], {
      errorMap: () => ({ message: '有効なカテゴリを選択してください' })
    }),
    
    aliases: z.array(z.string().max(100, '別表記は100文字以内です'))
      .max(10, '別表記は10個まで登録可能です')
      .optional()
      .transform(aliases => aliases?.filter(alias => alias.trim() !== '') || []),
    
    initialAccentType: z.enum(['atamadaka', 'heiban', 'nakadaka', 'odaka'], {
      errorMap: () => ({ message: '有効なアクセント型を選択してください' })
    }),
    
    prefecture: z.string()
      .length(2, '都道府県コードは2文字です')
      .regex(/^[0-4][0-9]$/, '有効な都道府県コードを選択してください'),
    
    ageGroup: z.enum(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .optional()
  }).refine(async (data) => {
    // カスタムバリデーション：モーラ数チェック
    const moraCount = MoraAnalyzer.countMora(data.reading);
    return moraCount >= 1 && moraCount <= 10;
  }, {
    message: 'モーラ数は1〜10の範囲で入力してください'
  });
}

// 投票バリデーション  
export class VoteValidator extends BaseValidator<VoteData> {
  schema = z.object({
    wordId: z.number()
      .int('語IDは整数である必要があります')
      .positive('語IDは正の値である必要があります'),
    
    accentTypeId: z.number()
      .int('アクセント型IDは整数である必要があります')
      .positive('アクセント型IDは正の値である必要があります'),
    
    accentType: z.enum(['atamadaka', 'heiban', 'nakadaka', 'odaka']),
    
    prefecture: z.string()
      .length(2, '都道府県コードは2文字です')
      .regex(/^[0-4][0-9]$/, '有効な都道府県コードを選択してください'),
    
    ageGroup: z.enum(['10s', '20s', '30s', '40s', '50s', '60s', '70s+'])
      .optional(),
    
    deviceFingerprint: z.string()
      .min(10, 'デバイスフィンガープリントが短すぎます')
      .max(256, 'デバイスフィンガープリントが長すぎます'),
    
    turnstileToken: z.string()
      .min(1, 'ボット検証トークンは必須です')
  });
}
```

### 5.3 キャッシュ統一設計

```typescript
// src/lib/cache/CacheManager.ts
export class CacheManager {
  private redisClient: Redis;
  private memoryCache: Map<string, CacheEntry>;
  private logger: ILogger;

  constructor(redisClient: Redis, logger: ILogger) {
    this.redisClient = redisClient;
    this.memoryCache = new Map();
    this.logger = logger;
    
    // メモリキャッシュの定期クリーンアップ
    setInterval(() => this.cleanupMemoryCache(), 60000); // 1分間隔
  }

  @Retry(3)
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      // L1: メモリキャッシュ確認
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.logger.debug('Cache hit (memory)', { key });
        return memoryEntry.value;
      }

      // L2: Redis確認
      const redisValue = await this.redisClient.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        
        // メモリキャッシュにも保存（短期間）
        this.memoryCache.set(key, {
          value: parsed,
          expiresAt: Date.now() + (options?.memoryTTL || 60000) // デフォルト1分
        });
        
        this.logger.debug('Cache hit (redis)', { key });
        return parsed;
      }

      this.logger.debug('Cache miss', { key });
      return null;

    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      // Redis に保存
      await this.redisClient.setex(key, ttl, serialized);
      
      // メモリキャッシュにも保存（短期間）
      const memoryTTL = Math.min(ttl * 1000, 60000); // 最大1分
      this.memoryCache.set(key, {
        value,
        expiresAt: Date.now() + memoryTTL
      });

      this.logger.debug('Cache set', { key, ttl });

    } catch (error) {
      this.logger.error('Cache set error', { key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.memoryCache.delete(key);
      
      this.logger.debug('Cache deleted', { key });

    } catch (error) {
      this.logger.error('Cache delete error', { key, error });
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      // Redis のパターン削除
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }

      // メモリキャッシュのパターン削除
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }

      this.logger.debug('Cache pattern deleted', { pattern, keyCount: keys.length });

    } catch (error) {
      this.logger.error('Cache pattern delete error', { pattern, error });
      throw error;
    }
  }

  // デコレータ用のヘルパーメソッド
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Memory cache cleaned', { cleanedCount });
    }
  }
}

// キャッシュデコレータ
export function CacheResult(keyPrefix: string, ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = DIContainer.getInstance().resolve<CacheManager>('CacheManager');
      
      // キャッシュキー生成
      const argsKey = JSON.stringify(args);
      const cacheKey = `${keyPrefix}:${propertyKey}:${Buffer.from(argsKey).toString('base64')}`;

      return await cacheManager.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}
```

### 5.4 ログ設計

```typescript
// src/lib/monitoring/Logger.ts
export class StructuredLogger implements ILogger {
  private winston: winston.Logger;
  private requestId: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(this.formatLogEntry.bind(this))
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/app.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 10
        })
      ]
    });
  }

  setContext(requestId?: string, userId?: string): ILogger {
    const logger = new StructuredLogger();
    logger.winston = this.winston;
    logger.requestId = requestId || null;
    logger.userId = userId || null;
    return logger;
  }

  info(message: string, meta?: LogMeta): void {
    this.winston.info(message, this.enrichMeta(meta));
  }

  warn(message: string, meta?: LogMeta): void {
    this.winston.warn(message, this.enrichMeta(meta));
  }

  error(message: string, meta?: LogMeta & { error?: Error }): void {
    this.winston.error(message, this.enrichMeta(meta));
  }

  debug(message: string, meta?: LogMeta): void {
    this.winston.debug(message, this.enrichMeta(meta));
  }

  private enrichMeta(meta?: LogMeta): LogMeta {
    return {
      ...meta,
      requestId: this.requestId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      service: 'accent-vote-site',
      version: process.env.npm_package_version
    };
  }

  private formatLogEntry(info: winston.LogEntry): string {
    const { timestamp, level, message, requestId, userId, ...meta } = info;
    
    const baseInfo = {
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      message,
      requestId,
      userId
    };

    // エラー情報の特別処理
    if (info.error) {
      baseInfo.error = {
        name: info.error.name,
        message: info.error.message,
        stack: info.error.stack
      };
    }

    return JSON.stringify({ ...baseInfo, ...meta });
  }
}

// パフォーマンス監視デコレータ
export function LogPerformance(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = DIContainer.getInstance().resolve<ILogger>('Logger');
      const startTime = Date.now();

      logger.debug(`${operation} started`, {
        operation,
        method: propertyKey,
        args: args.length
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.info(`${operation} completed`, {
          operation,
          method: propertyKey,
          duration,
          success: true
        });

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(`${operation} failed`, {
          operation,
          method: propertyKey,
          duration,
          success: false,
          error
        });

        throw error;
      }
    };

    return descriptor;
  };
}
```

## 6. まとめ

### 6.1 実装の優先順位

1. **フェーズ1: 基盤構築**
   - プロジェクト構造とビルド環境構築
   - データベースセットアップとマイグレーション
   - 基本的なAPI Routes実装
   - 共通処理（エラーハンドリング、ログ、キャッシュ）実装

2. **フェーズ2: コア機能実装**
   - 語モジュール（検索、詳細表示）
   - 投票モジュール（投票処理、重複チェック）
   - 統計モジュール（基本統計計算）

3. **フェーズ3: 拡張機能実装**
   - 管理機能（承認、却下）
   - ランキング・新着機能
   - リアルタイム更新機能

4. **フェーズ4: 最適化・監視**
   - パフォーマンス最適化
   - 監視・ログ強化
   - テストカバレッジ向上

### 6.2 並列開発のための分担案

- **チーム A**: 語モジュール + 検索機能
- **チーム B**: 投票モジュール + 統計機能  
- **チーム C**: 認証・管理機能
- **チーム D**: UI/UX + フロントエンドコンポーネント

各チームは独立したモジュールで作業し、インターフェースを通じて連携することで、効率的な並列開発を実現できます。

I will also generate the following answer based on CLAUDE.md