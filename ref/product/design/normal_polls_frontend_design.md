# 通常投票（汎用投票）フロントエンド技術設計書

**プロジェクト**: 日本語アクセント投票サイト  
**対象機能**: 汎用投票システム  
**バージョン**: 1.0  
**作成日**: 2025-09-06

## 目次

1. [概要](#1-概要)
2. [技術スタック](#2-技術スタック)
3. [コンポーネント設計](#3-コンポーネント設計)
4. [データフロー設計](#4-データフロー設計)
5. [グラフ表示ロジック](#5-グラフ表示ロジック)
6. [ルーティング設計](#6-ルーティング設計)
7. [状態管理](#7-状態管理)
8. [UIUXガイドライン](#8-uiuxガイドライン)
9. [実装優先度](#9-実装優先度)
10. [パフォーマンス考慮事項](#10-パフォーマンス考慮事項)

## 1. 概要

### 1.1 目的
既存のアクセント投票システムとの一貫性を保ちながら、汎用的な投票機能を実装する。方言モード対応、統計表示、リアルタイム更新機能を含む。

### 1.2 設計原則
- 既存コンポーネントとの設計統一性
- レスポンシブ対応
- アクセシビリティ（WCAG 2.1 AA準拠）
- 型安全性とエラーハンドリング
- 並列開発可能なモジュラー設計

### 1.3 対象範囲
- 投票一覧ページ（/polls）
- 投票詳細・実行ページ（/polls/[id]）
- 結果表示ページ（/polls/[id]/results）
- 関連UIコンポーネント群

## 2. 技術スタック

### 2.1 既存技術との統一
```typescript
// 既存システムとの技術統一
- Framework: Next.js 14 (App Router)
- UI Framework: React 18
- Styling: Tailwind CSS + shadcn/ui
- Type System: TypeScript 5.x
- State Management: React Query (TanStack Query)
- Animation: Framer Motion
- Charts: ECharts（既存統計機能と統一）
- HTTP Client: Fetch API
```

### 2.2 新規導入ライブラリ
```typescript
// 通常投票特有の機能向け
- @tanstack/react-query: 4.x (既存と統一)
- echarts: 5.x (地図・グラフ表示)
- react-hook-form: 7.x (フォーム管理)
- zod: 3.x (バリデーション)
```

## 3. コンポーネント設計

### 3.1 ページコンポーネント

#### 3.1.1 PollsListPage (/polls)
```typescript
// app/polls/page.tsx
interface PollsListPageProps {
  searchParams?: {
    q?: string;
    status?: 'active' | 'ended' | 'draft';
    sort?: 'popular' | 'recent' | 'ending_soon';
    page?: string;
  };
}

export default function PollsListPage({ searchParams }: PollsListPageProps) {
  // 実装概要:
  // - 投票検索・フィルタ機能
  // - ページネーション
  // - ソート機能
  // - 投票カード一覧表示
  // - リアルタイム統計更新
}
```

**責務**:
- 投票一覧の表示とフィルタリング
- 検索機能の提供
- 投票カードの一覧レイアウト
- ページネーション制御

#### 3.1.2 PollDetailPage (/polls/[id])
```typescript
// app/polls/[id]/page.tsx
interface PollDetailPageProps {
  params: { id: string };
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  // 実装概要:
  // - 投票詳細情報表示
  // - 投票フォーム制御
  // - ユーザー投票状態管理
  // - リアルタイム統計表示
}
```

**責務**:
- 投票詳細の表示
- 投票実行フォームの管理
- ユーザー認証・投票権限確認
- 投票進行状況の表示

#### 3.1.3 PollResultsPage (/polls/[id]/results)
```typescript
// app/polls/[id]/results/page.tsx
interface PollResultsPageProps {
  params: { id: string };
  searchParams?: {
    view?: 'chart' | 'demographics' | 'geographic';
  };
}

export default function PollResultsPage({ params, searchParams }: PollResultsPageProps) {
  // 実装概要:
  // - 投票結果の総合表示
  // - 複数視点での分析表示
  // - データエクスポート機能
  // - シェア機能
}
```

**責務**:
- 投票結果の総合分析表示
- 視点切り替え機能
- データ可視化
- 結果の共有機能

### 3.2 UIコンポーネント

#### 3.2.1 PollCard - 投票カード表示
```typescript
// components/features/polls/PollCard.tsx
interface PollCardProps {
  poll: Poll;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
  showCreator?: boolean;
  onVoteClick?: () => void;
  className?: string;
}

export function PollCard({
  poll,
  size = 'md',
  showStats = true,
  showCreator = false,
  onVoteClick,
  className
}: PollCardProps) {
  // 実装概要:
  // - 投票基本情報表示（タイトル、説明、締切）
  // - 投票状態表示（進行中/終了/下書き）
  // - クイック統計表示（参加者数、選択肢数）
  // - アニメーション効果（hover、click）
  // - アクセント投票カードとの一貫性保持
}
```

**設計仕様**:
- `AccentCard`と同様のMotion効果
- shadcn/ui Card componentをベース
- 複数サイズ対応（sm/md/lg）
- レスポンシブ対応

#### 3.2.2 PollVotingForm - 投票フォーム
```typescript
// components/features/polls/PollVotingForm.tsx
interface PollVotingFormProps {
  poll: PollDetail;
  onSubmit: (vote: PollVote) => Promise<void>;
  disabled?: boolean;
  userVote?: PollVote | null;
}

export function PollVotingForm({
  poll,
  onSubmit,
  disabled = false,
  userVote
}: PollVotingFormProps) {
  // 実装概要:
  // - 投票選択肢表示（単選択・複選択対応）
  // - フォームバリデーション
  // - 投票送信処理
  // - エラーハンドリング
  // - 投票済み状態表示
}
```

**フォーム制御**:
```typescript
// フォームスキーマ（zod使用）
const pollVoteSchema = z.object({
  pollId: z.number(),
  selectedOptions: z.array(z.number()).min(1, '選択肢を選んでください'),
  deviceId: z.string().uuid(),
});

type PollVoteFormData = z.infer<typeof pollVoteSchema>;
```

#### 3.2.3 PollResultsChart - 結果グラフ表示
```typescript
// components/features/polls/PollResultsChart.tsx
interface PollResultsChartProps {
  poll: PollDetail;
  viewType: 'bar' | 'pie' | 'donut';
  showPercentages?: boolean;
  showVoteCounts?: boolean;
  animated?: boolean;
  height?: number;
}

export function PollResultsChart({
  poll,
  viewType,
  showPercentages = true,
  showVoteCounts = true,
  animated = true,
  height = 400
}: PollResultsChartProps) {
  // 実装概要:
  // - EChartsを使用した結果可視化
  // - 複数チャートタイプ対応
  // - レスポンシブ対応
  // - アニメーション効果
  // - アクセシビリティ対応
}
```

**チャートタイプ選択ロジック**:
```typescript
function getOptimalChartType(optionCount: number, totalVotes: number): ChartType {
  if (optionCount <= 2) return 'bar';
  if (optionCount <= 5) return 'pie';
  return 'bar'; // 多選択肢は棒グラフが見やすい
}
```

#### 3.2.4 PollStatistics - 統計情報表示
```typescript
// components/features/polls/PollStatistics.tsx
interface PollStatisticsProps {
  poll: PollDetail;
  view: 'overview' | 'detailed';
  showTrends?: boolean;
}

export function PollStatistics({
  poll,
  view,
  showTrends = false
}: PollStatisticsProps) {
  // 実装概要:
  // - 基本統計情報表示（総投票数、参加率など）
  // - 時系列データ表示
  // - 統計カード群のレイアウト
  // - データ更新アニメーション
}
```

#### 3.2.5 DemographicBreakdown - 属性別分析
```typescript
// components/features/polls/DemographicBreakdown.tsx
interface DemographicBreakdownProps {
  poll: PollDetail;
  breakdownType: 'age' | 'gender' | 'prefecture';
  showComparisons?: boolean;
}

export function DemographicBreakdown({
  poll,
  breakdownType,
  showComparisons = false
}: DemographicBreakdownProps) {
  // 実装概要:
  // - 属性別投票傾向分析
  // - クロス集計表示
  // - ヒートマップ表示（都道府県別）
  // - 統計的有意性表示
}
```

### 3.3 共通ユーティリティコンポーネント

#### 3.3.1 LoadingStates
```typescript
// components/features/polls/LoadingStates.tsx
export const PollCardSkeleton = () => {
  // shadcn/ui Skeletonを使用した一貫性のあるローディング表示
};

export const PollDetailSkeleton = () => {
  // 投票詳細画面のスケルトン表示
};
```

#### 3.3.2 ErrorBoundary
```typescript
// components/features/polls/ErrorBoundary.tsx
export const PollErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  // React ErrorBoundaryを使用したエラーハンドリング
  // ユーザーフレンドリーなエラー表示
};
```

## 4. データフロー設計

### 4.1 API通信パターン

#### 4.1.1 APIエンドポイント定義
```typescript
// lib/api/polls.ts
export const pollsApi = {
  // 投票一覧取得
  getPolls: (params: PollsQuery) => 
    fetch(`/api/polls?${new URLSearchParams(params)}`),
  
  // 投票詳細取得
  getPoll: (id: number) => 
    fetch(`/api/polls/${id}`),
  
  // 投票実行
  submitVote: (pollId: number, vote: PollVoteData) =>
    fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote),
      credentials: 'include'
    }),
  
  // 投票結果取得
  getPollResults: (id: number, params?: ResultsQuery) =>
    fetch(`/api/polls/${id}/results?${new URLSearchParams(params || {})}`),
  
  // 統計データ取得
  getPollStatistics: (id: number, breakdown?: string) =>
    fetch(`/api/polls/${id}/statistics?breakdown=${breakdown || 'overview'}`)
};
```

### 4.2 React Query実装

#### 4.2.1 カスタムフック定義
```typescript
// hooks/usePollsQuery.ts
export function usePollsQuery(params: PollsQuery) {
  return useQuery({
    queryKey: ['polls', params],
    queryFn: () => pollsApi.getPolls(params),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
  });
}

export function usePollQuery(id: number) {
  return useQuery({
    queryKey: ['poll', id],
    queryFn: () => pollsApi.getPoll(id),
    staleTime: 2 * 60 * 1000, // 2分間キャッシュ（投票中は頻繁に更新）
  });
}

export function usePollVoteMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pollId, vote }: { pollId: number; vote: PollVoteData }) =>
      pollsApi.submitVote(pollId, vote),
    onSuccess: (data, variables) => {
      // 関連データの無効化・更新
      queryClient.invalidateQueries({ queryKey: ['poll', variables.pollId] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['poll-results', variables.pollId] });
    },
  });
}

export function usePollResultsQuery(id: number, params?: ResultsQuery) {
  return useQuery({
    queryKey: ['poll-results', id, params],
    queryFn: () => pollsApi.getPollResults(id, params),
    staleTime: 30 * 1000, // 30秒間キャッシュ（結果は頻繁に更新）
  });
}
```

#### 4.2.2 リアルタイム更新戦略
```typescript
// hooks/useRealtimePolls.ts
export function useRealtimePollUpdates(pollId: number) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // 30秒ごとにポーリング更新
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['poll', pollId],
        exact: false 
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pollId, queryClient]);
}

// 投票詳細画面で使用
export function usePollWithRealtimeUpdates(pollId: number) {
  const pollQuery = usePollQuery(pollId);
  useRealtimePollUpdates(pollId);
  
  return pollQuery;
}
```

## 5. グラフ表示ロジック

### 5.1 選択肢数に応じたチャートタイプ選択

```typescript
// utils/chartUtils.ts
export type ChartType = 'bar' | 'pie' | 'donut' | 'horizontal-bar';

export function selectOptimalChartType(
  optionCount: number, 
  totalVotes: number,
  containerWidth: number
): ChartType {
  // 2選択肢: 棒グラフ（対比が明確）
  if (optionCount === 2) {
    return containerWidth < 400 ? 'horizontal-bar' : 'bar';
  }
  
  // 3-5選択肢: 円グラフ（割合が分かりやすい）
  if (optionCount <= 5 && containerWidth >= 300) {
    return 'pie';
  }
  
  // 6選択肢以上: 棒グラフ（可読性重視）
  return containerWidth < 500 ? 'horizontal-bar' : 'bar';
}

export function generateChartColors(optionCount: number): string[] {
  // ColorBrewer準拠のアクセシビリティ対応色配列
  const colorSets = {
    2: ['#2563eb', '#dc2626'], // 青・赤
    3: ['#2563eb', '#dc2626', '#16a34a'], // 青・赤・緑
    4: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04'], // 青・赤・緑・黄
    5: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'], // +紫
  };
  
  if (optionCount <= 5) {
    return colorSets[optionCount as keyof typeof colorSets] || colorSets[5];
  }
  
  // 6選択肢以上は自動生成
  return generateDistinctColors(optionCount);
}
```

### 5.2 アニメーション効果の実装

```typescript
// components/features/polls/PollResultsChart.tsx
export function PollResultsChart({ poll, animated = true }: PollResultsChartProps) {
  const chartConfig = useMemo(() => {
    const baseConfig = {
      // ECharts基本設定
      animation: animated,
      animationDuration: 1000,
      animationEasing: 'cubicInOut',
    };
    
    if (chartType === 'bar') {
      return {
        ...baseConfig,
        xAxis: { 
          type: 'category',
          data: poll.options.map(opt => opt.text),
          axisLabel: { interval: 0, rotate: poll.options.length > 4 ? 45 : 0 }
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: poll.results,
          itemStyle: { 
            color: (params: any) => colors[params.dataIndex],
            borderRadius: [4, 4, 0, 0]
          },
          animationDelay: (idx: number) => idx * 100, // 順次表示
        }]
      };
    }
    
    // 他のチャートタイプの設定...
  }, [poll, animated, chartType]);
}
```

### 5.3 レスポンシブ対応

```typescript
// hooks/useResponsiveChart.ts
export function useResponsiveChart(containerRef: RefObject<HTMLDivElement>) {
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(200, Math.min(width * 0.6, 500)) // アスペクト比調整
      });
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);
  
  return dimensions;
}
```

## 6. ルーティング設計

### 6.1 動的ルーティングの実装

```typescript
// app/polls/layout.tsx
export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 投票システム共通ヘッダー */}
      <PollsHeader />
      
      {/* ページコンテンツ */}
      <main className="mt-6">
        {children}
      </main>
      
      {/* フッター */}
      <PollsFooter />
    </div>
  );
}
```

### 6.2 ナビゲーション統合

```typescript
// components/layout/Navigation.tsx - 既存ナビゲーションに追加
const navigationItems = [
  // 既存項目...
  {
    label: '通常投票',
    href: '/polls',
    description: '様々なトピックについて投票',
    icon: Vote,
    subItems: [
      { label: '投票一覧', href: '/polls' },
      { label: '人気の投票', href: '/polls?sort=popular' },
      { label: '終了間近', href: '/polls?sort=ending_soon' },
    ]
  },
];
```

### 6.3 SEO・メタデータ設定

```typescript
// app/polls/[id]/page.tsx
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const poll = await getPollForMetadata(params.id);
  
  return {
    title: `${poll.title} | 日本語アクセント投票サイト`,
    description: poll.description || `${poll.title}について投票しよう`,
    openGraph: {
      title: poll.title,
      description: poll.description,
      images: [
        {
          url: `/api/polls/${params.id}/og-image`,
          width: 1200,
          height: 630,
          alt: poll.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: poll.title,
      description: poll.description,
    },
  };
}
```

## 7. 状態管理

### 7.1 グローバル状態設計

```typescript
// contexts/PollsContext.tsx
interface PollsContextType {
  // ユーザー投票状態
  userVotes: Record<number, PollVote>;
  
  // フィルター状態
  filters: {
    status: PollStatus[];
    category: string[];
    sortBy: SortOption;
  };
  
  // UI状態
  viewPreferences: {
    cardSize: 'sm' | 'md' | 'lg';
    chartType: ChartType;
    showDetails: boolean;
  };
  
  // アクション
  actions: {
    updateUserVote: (pollId: number, vote: PollVote) => void;
    updateFilters: (filters: Partial<PollFilters>) => void;
    updateViewPreferences: (prefs: Partial<ViewPreferences>) => void;
  };
}
```

### 7.2 ローカルストレージ統合

```typescript
// hooks/useLocalStorage.ts - 既存utilsと統合
export function usePollsLocalStorage() {
  const [userVotes, setUserVotes] = useLocalStorage<Record<number, PollVote>>(
    'polls:user_votes',
    {}
  );
  
  const [viewPreferences, setViewPreferences] = useLocalStorage<ViewPreferences>(
    'polls:view_preferences',
    {
      cardSize: 'md',
      chartType: 'auto',
      showDetails: true,
    }
  );
  
  return {
    userVotes,
    setUserVotes,
    viewPreferences,
    setViewPreferences,
  };
}
```

## 8. UI/UXガイドライン

### 8.1 既存デザインシステムとの統一

```typescript
// デザイントークン統一（既存システムから継承）
const pollsDesignTokens = {
  // カラーパレット
  colors: {
    primary: 'hsl(var(--primary))', // 既存システムと統一
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    // 投票状態専用色
    active: '#10b981', // 緑（実施中）
    ended: '#6b7280',  // グレー（終了）
    draft: '#f59e0b',  // 黄（下書き）
  },
  
  // スペーシング
  spacing: {
    pollCard: '1.5rem', // 24px
    option: '1rem',     // 16px
    chart: '2rem',      // 32px
  },
  
  // タイポグラフィ
  typography: {
    pollTitle: 'text-xl font-semibold',
    optionText: 'text-base font-medium',
    statText: 'text-sm text-muted-foreground',
  },
};
```

### 8.2 アクセシビリティ対応

```typescript
// components/features/polls/PollVotingForm.tsx
export function PollVotingForm({ poll }: PollVotingFormProps) {
  return (
    <form 
      role="form" 
      aria-labelledby="poll-title"
      aria-describedby="poll-description"
    >
      <fieldset>
        <legend className="sr-only">投票選択肢</legend>
        {poll.options.map((option, index) => (
          <div key={option.id} className="poll-option">
            <input
              type={poll.allowMultiple ? 'checkbox' : 'radio'}
              id={`option-${option.id}`}
              name="poll-options"
              value={option.id}
              aria-describedby={`option-${option.id}-desc`}
            />
            <label htmlFor={`option-${option.id}`}>
              {option.text}
            </label>
            {option.description && (
              <p id={`option-${option.id}-desc`} className="sr-only">
                {option.description}
              </p>
            )}
          </div>
        ))}
      </fieldset>
    </form>
  );
}
```

### 8.3 レスポンシブデザイン

```css
/* styles/polls.css */
.poll-grid {
  @apply grid gap-6;
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

.poll-detail-layout {
  @apply grid gap-8;
  @apply grid-cols-1 lg:grid-cols-3;
}

.poll-voting-section {
  @apply lg:col-span-2;
}

.poll-stats-sidebar {
  @apply lg:col-span-1;
}

@media (max-width: 768px) {
  .poll-chart {
    @apply h-64; /* モバイルでは高さを制限 */
  }
  
  .poll-options {
    @apply space-y-3; /* モバイルでは選択肢間隔を広く */
  }
}
```

## 9. 実装優先度

### 9.1 Phase 1: 基本的な投票一覧と詳細表示（2週間）

#### 必須実装項目
- [ ] `PollsListPage`: 投票一覧表示
- [ ] `PollCard`: 投票カード基本表示
- [ ] `PollDetailPage`: 投票詳細表示（読み取り専用）
- [ ] 基本的なAPI通信（React Query）
- [ ] ルーティング設定
- [ ] ローディング・エラー状態

#### 成果物
```typescript
// 完成コンポーネント一覧
- app/polls/page.tsx
- app/polls/[id]/page.tsx
- components/features/polls/PollCard.tsx
- components/features/polls/LoadingStates.tsx
- hooks/usePollsQuery.ts
- lib/api/polls.ts
```

#### 開発分担可能性
- **開発者A**: PollsListPageとPollCard
- **開発者B**: PollDetailPageと基本API
- **開発者C**: ローディング状態とエラーハンドリング

### 9.2 Phase 2: 投票実行機能（2週間）

#### 必須実装項目
- [ ] `PollVotingForm`: 投票フォーム
- [ ] Cookie認証統合
- [ ] 投票送信・結果更新
- [ ] バリデーション・エラーハンドリング
- [ ] 投票済み状態表示

#### 成果物
```typescript
// 追加コンポーネント
- components/features/polls/PollVotingForm.tsx
- hooks/usePollVoteMutation.ts
- utils/pollValidation.ts
```

#### 開発分担可能性
- **開発者A**: PollVotingFormのUI実装
- **開発者B**: 投票API連携と状態管理
- **開発者C**: バリデーション・エラーハンドリング

### 9.3 Phase 3: 結果表示とグラフ（2週間）

#### 必須実装項目
- [ ] `PollResultsPage`: 結果表示ページ
- [ ] `PollResultsChart`: EChartsグラフ表示
- [ ] `PollStatistics`: 統計情報表示
- [ ] チャート自動選択ロジック
- [ ] アニメーション効果

#### 成果物
```typescript
// 結果表示関連
- app/polls/[id]/results/page.tsx
- components/features/polls/PollResultsChart.tsx
- components/features/polls/PollStatistics.tsx
- utils/chartUtils.ts
```

### 9.4 Phase 4: 属性別分析機能（1週間）

#### 必須実装項目
- [ ] `DemographicBreakdown`: 属性別分析
- [ ] 都道府県別分析（地図表示）
- [ ] 年齢・性別クロス分析
- [ ] データエクスポート機能

#### 成果物
```typescript
// 高度な分析機能
- components/features/polls/DemographicBreakdown.tsx
- components/features/polls/GeographicAnalysis.tsx
- utils/statisticsCalculation.ts
```

## 10. パフォーマンス考慮事項

### 10.1 コード分割戦略

```typescript
// 遅延ローディング設定
const PollResultsChart = lazy(() => 
  import('@/components/features/polls/PollResultsChart')
);

const DemographicBreakdown = lazy(() => 
  import('@/components/features/polls/DemographicBreakdown')
);

// 使用場所でSuspense包含
<Suspense fallback={<ChartSkeleton />}>
  <PollResultsChart poll={poll} />
</Suspense>
```

### 10.2 キャッシュ戦略

```typescript
// React Queryキャッシュ設定
const pollsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// 投票結果は短時間キャッシュ（リアルタイム性重視）
const usePollResultsQuery = (id: number) => 
  useQuery({
    queryKey: ['poll-results', id],
    queryFn: () => pollsApi.getPollResults(id),
    staleTime: 30 * 1000, // 30秒
  });
```

### 10.3 バンドルサイズ最適化

```typescript
// EChartsの必要モジュールのみインポート
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

### 10.4 画像最適化

```typescript
// Next.js Image最適化の活用
import Image from 'next/image';

export function PollCard({ poll }: PollCardProps) {
  return (
    <Card>
      {poll.thumbnailUrl && (
        <Image
          src={poll.thumbnailUrl}
          alt={poll.title}
          width={300}
          height={200}
          className="rounded-t-lg"
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
        />
      )}
    </Card>
  );
}
```

## まとめ

この技術設計書は以下の特徴を持っています：

1. **既存システムとの一貫性**: アクセント投票システムの技術スタックとデザインパターンを踏襲
2. **モジュラー設計**: コンポーネントごとに明確な責務分離、並列開発が可能
3. **型安全性**: TypeScriptによる厳密な型定義
4. **パフォーマンス**: React Query、コード分割、キャッシュ戦略による最適化
5. **アクセシビリティ**: WCAG 2.1 AA準拠のUI設計
6. **拡張性**: 方言モードなどの将来機能への対応

実装時は Phase 1 から順次進め、各フェーズで動作するものを積み上げていく方針が推奨されます。

I will also generate the following answer based on CLAUDE.md