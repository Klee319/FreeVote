# フロントエンド設計書: 日本語アクセント投票サイト

**バージョン**: 1.0  
**最終更新日**: 2025-08-28

## 1. 技術スタック

### コアフレームワーク
- **Next.js 14** (App Router)
- **TypeScript 5.x**
- **React 18**

### スタイリング
- **Tailwind CSS 3.x** (ベーススタイル)
- **Headless UI** (アクセシブルなコンポーネント)
- **Heroicons** (アイコンセット)
- **clsx** (条件付きクラス名)

### 状態管理・データフェッチング
- **TanStack Query v5** (サーバー状態管理・キャッシュ)
- **Zustand** (クライアント状態管理)
- **React Hook Form** (フォーム管理)
- **Zod** (バリデーション)

### 可視化・UI
- **ECharts** (日本地図・グラフ描画)
- **Framer Motion** (アニメーション)
- **React Hot Toast** (通知)

### 開発・品質管理
- **ESLint** + **Prettier** (コード品質)
- **Husky** + **lint-staged** (Git hooks)
- **Vitest** + **React Testing Library** (テスト)
- **Storybook** (コンポーネント開発)

## 2. ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認証が必要な画面グループ
│   │   ├── dashboard/
│   │   └── submit/
│   ├── admin/                   # 管理者画面
│   ├── words/                   # 語詳細画面
│   │   └── [id]/
│   ├── search/                  # 検索結果画面
│   ├── ranking/                 # ランキング画面
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # トップページ
│   └── not-found.tsx           # 404ページ
├── components/                   # 再利用可能コンポーネント
│   ├── ui/                     # 基本UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── features/               # 機能特化コンポーネント
│   │   ├── accent/             # アクセント関連
│   │   │   ├── AccentCard.tsx
│   │   │   ├── AccentPattern.tsx
│   │   │   └── VoteButtons.tsx
│   │   ├── search/             # 検索関連
│   │   │   ├── SearchBox.tsx
│   │   │   └── WordList.tsx
│   │   ├── stats/              # 統計関連
│   │   │   ├── JapanMap.tsx
│   │   │   ├── PrefectureChart.tsx
│   │   │   └── RankingTable.tsx
│   │   └── auth/               # 認証関連
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── layout/                 # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   └── common/                 # 共通コンポーネント
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── Pagination.tsx
├── hooks/                       # カスタムフック
│   ├── api/                    # API関連フック
│   │   ├── useWords.ts
│   │   ├── useVotes.ts
│   │   ├── useStats.ts
│   │   └── useAuth.ts
│   ├── useLocalStorage.ts      # ローカルストレージ
│   ├── useDeviceId.ts          # デバイス識別
│   ├── useTurnstile.ts         # ボット対策
│   └── useGeolocation.ts       # 位置情報（都道府県推定用）
├── lib/                        # ユーティリティ・設定
│   ├── api.ts                  # API クライアント
│   ├── auth.ts                 # 認証設定
│   ├── constants.ts            # 定数定義
│   ├── utils.ts                # ユーティリティ関数
│   ├── validations.ts          # バリデーションスキーマ
│   └── mora.ts                 # モーラ分割ロジック
├── store/                      # 状態管理
│   ├── authStore.ts           # 認証状態
│   ├── voteStore.ts           # 投票状態
│   └── uiStore.ts             # UI状態
├── types/                      # 型定義
│   ├── api.ts                 # API型定義
│   ├── word.ts                # 語関連型
│   ├── vote.ts                # 投票関連型
│   └── user.ts                # ユーザー関連型
└── styles/                     # スタイル関連
    ├── components.css         # コンポーネント固有スタイル
    └── echarts-theme.ts       # EChartsテーマ設定
```

## 3. 画面設計

### 3.1 トップページ (`/`)
```typescript
// app/page.tsx
interface TopPageProps {
  initialRanking: WordSummary[];
  recentWords: WordSummary[];
}

export default function TopPage({ initialRanking, recentWords }: TopPageProps) {
  return (
    <div className="container mx-auto px-4">
      <SearchSection />
      <RankingSection initialData={initialRanking} />
      <RecentWordsSection initialData={recentWords} />
    </div>
  );
}
```

#### コンポーネント構成
- `SearchSection`: 検索バー・クイック検索
- `RankingSection`: 人気語ランキング（期間切替）
- `RecentWordsSection`: 新着語一覧

### 3.2 語詳細ページ (`/words/[id]`)
```typescript
// app/words/[id]/page.tsx
interface WordDetailPageProps {
  params: { id: string };
}

export default function WordDetailPage({ params }: WordDetailPageProps) {
  const { data: wordDetail, isLoading } = useWordDetail(params.id);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <WordHeader word={wordDetail.word} />
        <AccentVotingSection 
          accentOptions={wordDetail.accentOptions}
          canVote={wordDetail.canVote}
          userVote={wordDetail.userVote}
        />
        <StatisticsSection 
          nationalStats={wordDetail.nationalStats}
          wordId={wordDetail.word.id}
        />
      </div>
      <div>
        <RelatedWordsSection />
        <WordInfoPanel />
      </div>
    </div>
  );
}
```

#### コンポーネント構成
- `WordHeader`: 語の基本情報表示
- `AccentVotingSection`: 4アクセント型カード・投票
- `StatisticsSection`: 統計グラフ・日本地図
- `RelatedWordsSection`: 関連語・類似語
- `WordInfoPanel`: 投稿者情報・カテゴリ情報

## 4. 主要コンポーネント設計

### 4.1 アクセント型カード (`AccentCard.tsx`)
```typescript
interface AccentCardProps {
  accentOption: AccentOption;
  isSelected?: boolean;
  voteCount?: number;
  percentage?: number;
  onVote?: (accentTypeId: number) => void;
  disabled?: boolean;
  showPattern?: boolean;
}

export function AccentCard({ 
  accentOption, 
  isSelected, 
  voteCount, 
  percentage,
  onVote, 
  disabled,
  showPattern = true 
}: AccentCardProps) {
  return (
    <motion.div 
      className={clsx(
        'bg-white rounded-lg border-2 p-4 cursor-pointer transition-all',
        isSelected && 'border-blue-500 bg-blue-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => !disabled && onVote?.(accentOption.id)}
    >
      <div className="text-center mb-3">
        <h3 className="font-bold text-lg">{accentOption.accentType.name}</h3>
        {voteCount && (
          <p className="text-sm text-gray-600">
            {voteCount}票 ({percentage}%)
          </p>
        )}
      </div>
      
      {showPattern && (
        <AccentPattern 
          pattern={accentOption.pattern}
          moraSegments={wordDetail.moraSegments}
          dropPosition={accentOption.dropPosition}
        />
      )}
      
      <div className="mt-3 text-center">
        <button 
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium',
            isSelected 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
          disabled={disabled}
        >
          {isSelected ? '投票済み' : '投票する'}
        </button>
      </div>
    </motion.div>
  );
}
```

### 4.2 アクセントパターン描画 (`AccentPattern.tsx`)
```typescript
interface AccentPatternProps {
  pattern: number[]; // [0, 1, 1, 0] 形式
  moraSegments: string[]; // ['サ', 'ク', 'ラ']
  dropPosition?: number;
  className?: string;
}

export function AccentPattern({ 
  pattern, 
  moraSegments, 
  dropPosition,
  className 
}: AccentPatternProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const width = 280;
    const height = 80;
    const moraWidth = width / moraSegments.length;
    
    // モーラテキスト描画
    moraSegments.forEach((mora, i) => {
      svg.append('text')
        .attr('x', i * moraWidth + moraWidth / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm font-medium')
        .text(mora);
    });
    
    // アクセント線描画
    const line = d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveMonotoneX);
    
    const points: [number, number][] = pattern.map((level, i) => [
      i * moraWidth + moraWidth / 2,
      level === 1 ? 20 : 40 // 高い=20px, 低い=40px
    ]);
    
    svg.append('path')
      .datum(points)
      .attr('d', line)
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 3)
      .attr('fill', 'none');
    
    // 下がり目マーク
    if (dropPosition && dropPosition <= pattern.length) {
      svg.append('text')
        .attr('x', (dropPosition - 1) * moraWidth + moraWidth)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-red-600 font-bold')
        .text('↓');
    }
    
  }, [pattern, moraSegments, dropPosition]);
  
  return (
    <div className={clsx('bg-gray-50 rounded p-2', className)}>
      <svg
        ref={svgRef}
        width="100%"
        height="80"
        viewBox="0 0 280 80"
        className="overflow-visible"
      />
    </div>
  );
}
```

### 4.3 日本地図コンポーネント (`JapanMap.tsx`)
```typescript
interface JapanMapProps {
  wordId: number;
  prefectureData: Record<string, PrefectureMapData>;
  onPrefectureClick?: (prefectureCode: string) => void;
  selectedPrefecture?: string;
}

interface PrefectureMapData {
  dominantAccent: string;
  totalVotes: number;
  accentDistribution: Record<string, number>;
}

export function JapanMap({ 
  wordId, 
  prefectureData, 
  onPrefectureClick,
  selectedPrefecture 
}: JapanMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  const accentColors = {
    atamadaka: '#EF4444', // 赤
    heiban: '#3B82F6',    // 青
    nakadaka: '#10B981',  // 緑
    odaka: '#F59E0B'      // 黄
  };
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // ECharts初期化
    chartInstance.current = echarts.init(chartRef.current);
    
    // 日本地図のGeoJSONデータをロード
    import('@/data/japan-prefectures.json').then(geoData => {
      echarts.registerMap('japan', geoData);
      
      const mapData = Object.entries(prefectureData).map(([code, data]) => ({
        name: getPrefectureName(code),
        value: data.totalVotes,
        itemStyle: {
          color: data.totalVotes > 0 
            ? accentColors[data.dominantAccent as keyof typeof accentColors]
            : '#E5E7EB'
        },
        emphasis: {
          itemStyle: {
            color: '#FEF3C7'
          }
        }
      }));
      
      const option: echarts.EChartsOption = {
        title: {
          text: `アクセント分布地図`,
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const code = getPrefectureCode(params.name);
            const data = prefectureData[code];
            
            if (!data || data.totalVotes === 0) {
              return `${params.name}<br/>データなし`;
            }
            
            const distribution = Object.entries(data.accentDistribution)
              .map(([accent, count]) => 
                `${getAccentTypeName(accent)}: ${count}票 (${Math.round(count / data.totalVotes * 100)}%)`
              )
              .join('<br/>');
            
            return `${params.name}<br/>
                    総投票数: ${data.totalVotes}票<br/>
                    最多: ${getAccentTypeName(data.dominantAccent)}<br/>
                    <br/>${distribution}`;
          }
        },
        legend: {
          orient: 'horizontal',
          bottom: 10,
          data: Object.entries(accentColors).map(([accent, color]) => ({
            name: getAccentTypeName(accent),
            itemStyle: { color }
          }))
        },
        geo: {
          map: 'japan',
          roam: false,
          aspectScale: 1,
          layoutCenter: ['50%', '50%'],
          layoutSize: '100%'
        },
        series: [{
          type: 'map',
          map: 'japan',
          data: mapData,
          selectedMode: 'single',
          select: {
            itemStyle: {
              borderColor: '#000',
              borderWidth: 2
            }
          }
        }]
      };
      
      chartInstance.current?.setOption(option);
      
      // クリックイベント
      chartInstance.current?.on('click', (params: any) => {
        const code = getPrefectureCode(params.name);
        onPrefectureClick?.(code);
      });
    });
    
    return () => {
      chartInstance.current?.dispose();
    };
  }, [prefectureData, onPrefectureClick]);
  
  // 選択された都道府県のハイライト
  useEffect(() => {
    if (selectedPrefecture && chartInstance.current) {
      chartInstance.current.dispatchAction({
        type: 'select',
        name: getPrefectureName(selectedPrefecture)
      });
    }
  }, [selectedPrefecture]);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div 
        ref={chartRef} 
        className="w-full h-96"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
```

### 4.4 検索コンポーネント (`SearchBox.tsx`)
```typescript
interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  showSuggestions?: boolean;
}

export function SearchBox({ 
  onSearch, 
  placeholder = "語を検索...",
  initialValue = "",
  showSuggestions = true 
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { debounce } = useDebounce();
  
  const { data: suggestionData } = useQuery({
    queryKey: ['word-suggestions', query],
    queryFn: () => api.getWordSuggestions(query),
    enabled: showSuggestions && query.length > 0,
    staleTime: 5 * 60 * 1000 // 5分間キャッシュ
  });
  
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        onSearch(searchQuery);
      }
    }, 300),
    [onSearch, debounce]
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 0) {
      setIsOpen(true);
      debouncedSearch(value);
    } else {
      setIsOpen(false);
    }
  };
  
  const handleSuggestionClick = (word: WordSuggestion) => {
    setQuery(word.headword);
    setIsOpen(false);
    router.push(`/words/${word.id}`);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsOpen(false);
    }
  };
  
  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </form>
      
      {/* 検索候補 */}
      {isOpen && suggestionData && suggestionData.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestionData.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{suggestion.headword}</span>
                  <span className="ml-2 text-gray-600">({suggestion.reading})</span>
                </div>
                <div className="text-sm text-gray-500">
                  {suggestion.totalVotes}票
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 5. 状態管理設計

### 5.1 TanStack Query設定 (`lib/api.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間は新鮮なデータとして扱う
      cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// API関数群
export const api = {
  // 語検索
  searchWords: async (query: SearchWordsQuery): Promise<SearchWordsResponse> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    
    const response = await fetch(`/api/words?${params}`);
    return response.json();
  },
  
  // 語詳細取得
  getWordDetail: async (id: string): Promise<WordDetailResponse> => {
    const response = await fetch(`/api/words/${id}`);
    return response.json();
  },
  
  // 投票
  vote: async (voteData: VoteRequest): Promise<VoteResponse> => {
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData),
    });
    return response.json();
  },
  
  // 統計取得
  getWordStats: async (id: string, prefecture?: string): Promise<WordStatsResponse> => {
    const params = prefecture ? `?prefecture=${prefecture}` : '';
    const response = await fetch(`/api/words/${id}/stats${params}`);
    return response.json();
  }
};
```

### 5.2 カスタムフック (`hooks/api/useWords.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 語詳細取得フック
export function useWordDetail(id: string) {
  return useQuery({
    queryKey: ['word-detail', id],
    queryFn: () => api.getWordDetail(id),
    enabled: !!id,
  });
}

// 語検索フック
export function useSearchWords(query: SearchWordsQuery) {
  return useQuery({
    queryKey: ['words-search', query],
    queryFn: () => api.searchWords(query),
    enabled: !!query.q,
  });
}

// 投票フック
export function useVote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.vote,
    onSuccess: (data, variables) => {
      // 関連するキャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['word-detail', variables.wordId] });
      queryClient.invalidateQueries({ queryKey: ['word-stats', variables.wordId] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      
      // 楽観的更新
      queryClient.setQueryData(
        ['word-detail', variables.wordId],
        (old: WordDetailResponse) => ({
          ...old,
          data: {
            ...old.data,
            nationalStats: data.data.updatedStats.national,
            canVote: false,
            userVote: {
              accentType: data.data.accentType,
              prefecture: variables.prefecture,
              ageGroup: variables.ageGroup,
              votedAt: new Date().toISOString()
            }
          }
        })
      );
    },
    onError: (error) => {
      toast.error('投票に失敗しました: ' + error.message);
    }
  });
}
```

### 5.3 Zustand ストア (`store/voteStore.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VoteState {
  // 投票履歴（ローカル管理）
  voteHistory: Record<string, VoteHistoryItem>;
  
  // 進行中の投票
  pendingVotes: Record<string, PendingVote>;
  
  // ユーザー設定
  defaultPrefecture?: string;
  defaultAgeGroup?: string;
  
  // アクション
  addVoteHistory: (wordId: string, vote: VoteHistoryItem) => void;
  setPendingVote: (wordId: string, vote: PendingVote) => void;
  removePendingVote: (wordId: string) => void;
  setDefaults: (prefecture?: string, ageGroup?: string) => void;
  canVoteFor: (wordId: string) => boolean;
}

interface VoteHistoryItem {
  wordId: string;
  accentType: string;
  prefecture: string;
  ageGroup?: string;
  votedAt: string;
  canUndoUntil?: string;
}

interface PendingVote {
  accentTypeId: number;
  prefecture: string;
  ageGroup?: string;
  undoTimer?: NodeJS.Timeout;
}

export const useVoteStore = create<VoteState>()(
  persist(
    (set, get) => ({
      voteHistory: {},
      pendingVotes: {},
      
      addVoteHistory: (wordId, vote) =>
        set(state => ({
          voteHistory: {
            ...state.voteHistory,
            [wordId]: vote
          }
        })),
      
      setPendingVote: (wordId, vote) =>
        set(state => ({
          pendingVotes: {
            ...state.pendingVotes,
            [wordId]: vote
          }
        })),
      
      removePendingVote: (wordId) =>
        set(state => {
          const { [wordId]: removed, ...rest } = state.pendingVotes;
          if (removed?.undoTimer) {
            clearTimeout(removed.undoTimer);
          }
          return { pendingVotes: rest };
        }),
      
      setDefaults: (prefecture, ageGroup) =>
        set({ defaultPrefecture: prefecture, defaultAgeGroup: ageGroup }),
      
      canVoteFor: (wordId) => {
        const history = get().voteHistory[wordId];
        if (!history) return true;
        
        const lastVoteTime = new Date(history.votedAt);
        const now = new Date();
        const hoursSinceVote = (now.getTime() - lastVoteTime.getTime()) / (1000 * 60 * 60);
        
        return hoursSinceVote >= 24;
      }
    }),
    {
      name: 'vote-storage',
      partialize: (state) => ({
        voteHistory: state.voteHistory,
        defaultPrefecture: state.defaultPrefecture,
        defaultAgeGroup: state.defaultAgeGroup,
      }),
    }
  )
);
```

## 6. モーラ分割アルゴリズム実装

### 6.1 モーラ分割ロジック (`lib/mora.ts`)
```typescript
/**
 * カタカナ文字列をモーラ単位に分割する
 * 拗音（ャュョァィゥェォ）は直前の文字と結合して1モーラとする
 */
export function splitIntoMora(katakana: string): string[] {
  const mora: string[] = [];
  const chars = Array.from(katakana);
  
  // 拗音判定用のセット
  const smallKana = new Set([
    'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 
    'ッ', 'ヮ', 'ヵ', 'ヶ'
  ]);
  
  // 長音符・促音の扱い
  const longVowelMarks = new Set(['ー', '～']);
  
  let i = 0;
  while (i < chars.length) {
    const currentChar = chars[i];
    const nextChar = chars[i + 1];
    
    if (i > 0 && smallKana.has(currentChar)) {
      // 拗音の場合は前の文字と結合
      mora[mora.length - 1] += currentChar;
    } else if (currentChar === 'ッ' && nextChar) {
      // 促音の場合
      if (smallKana.has(nextChar)) {
        // 次が拗音なら結合
        mora.push(currentChar + nextChar);
        i++; // 次の文字をスキップ
      } else {
        // 単独の促音
        mora.push(currentChar);
      }
    } else if (longVowelMarks.has(currentChar)) {
      // 長音符は前のモーラと結合
      if (mora.length > 0) {
        mora[mora.length - 1] += currentChar;
      } else {
        mora.push(currentChar);
      }
    } else if (nextChar && smallKana.has(nextChar)) {
      // 次が拗音なら結合
      mora.push(currentChar + nextChar);
      i++; // 次の文字をスキップ
    } else {
      // 通常の文字
      mora.push(currentChar);
    }
    
    i++;
  }
  
  return mora;
}

/**
 * モーラ数をカウント
 */
export function countMora(katakana: string): number {
  return splitIntoMora(katakana).length;
}

/**
 * アクセント型に応じたピッチパターンを生成
 */
export function generateAccentPattern(
  moraCount: number, 
  accentType: 'atamadaka' | 'heiban' | 'nakadaka' | 'odaka',
  dropPosition?: number
): number[] {
  const pattern = new Array(moraCount);
  
  switch (accentType) {
    case 'atamadaka':
      // 頭高: [1, 0, 0, ...]
      pattern[0] = 1;
      for (let i = 1; i < moraCount; i++) {
        pattern[i] = 0;
      }
      break;
      
    case 'heiban':
      // 平板: [0, 1, 1, ...]
      pattern[0] = 0;
      for (let i = 1; i < moraCount; i++) {
        pattern[i] = 1;
      }
      break;
      
    case 'nakadaka':
      // 中高: [0, 1, 1, ..., 1, 0, 0, ...]
      const drop = dropPosition || Math.floor(moraCount / 2) + 1;
      pattern[0] = 0;
      for (let i = 1; i < Math.min(drop, moraCount); i++) {
        pattern[i] = 1;
      }
      for (let i = drop; i < moraCount; i++) {
        pattern[i] = 0;
      }
      break;
      
    case 'odaka':
      // 尾高: [0, 1, 1, ..., 1]
      if (moraCount === 1) {
        pattern[0] = 1;
      } else {
        pattern[0] = 0;
        for (let i = 1; i < moraCount; i++) {
          pattern[i] = 1;
        }
      }
      break;
  }
  
  return pattern;
}

/**
 * 読みをカタカナに正規化
 */
export function normalizeReading(reading: string): string {
  // ひらがなをカタカナに変換
  return reading.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

/**
 * モーラ分割の結果をテスト用に検証
 */
export function validateMoraSplit(input: string, expected: string[]): boolean {
  const result = splitIntoMora(input);
  return JSON.stringify(result) === JSON.stringify(expected);
}

// テストケース
if (process.env.NODE_ENV === 'test') {
  // テスト実行例
  console.assert(validateMoraSplit('サクラ', ['サ', 'ク', 'ラ']));
  console.assert(validateMoraSplit('キャベツ', ['キャ', 'ベ', 'ツ']));
  console.assert(validateMoraSplit('コーヒー', ['コー', 'ヒー']));
  console.assert(validateMoraSplit('ガッコウ', ['ガッ', 'コ', 'ウ']));
}
```

## 7. レスポンシブデザイン

### 7.1 ブレークポイント設定
```typescript
// tailwind.config.js での設定
const config = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

### 7.2 アクセント型カードのレスポンシブ配置
```typescript
// 4つのアクセント型カードのレスポンシブ配置
export function AccentVotingSection({ accentOptions, onVote }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {accentOptions.map((option) => (
        <AccentCard
          key={option.id}
          accentOption={option}
          onVote={onVote}
          className="min-h-32"
        />
      ))}
    </div>
  );
}
```

### 7.3 地図とグラフの切り替え表示
```typescript
export function StatisticsSection({ nationalStats, wordId }: Props) {
  const [activeTab, setActiveTab] = useState<'map' | 'chart'>('map');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* タブ切替（モバイルのみ） */}
      {isMobile && (
        <div className="flex mb-4 border-b">
          <button
            className={clsx(
              'flex-1 py-2 px-4 text-sm font-medium',
              activeTab === 'map' 
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            )}
            onClick={() => setActiveTab('map')}
          >
            地図で見る
          </button>
          <button
            className={clsx(
              'flex-1 py-2 px-4 text-sm font-medium',
              activeTab === 'chart' 
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            )}
            onClick={() => setActiveTab('chart')}
          >
            グラフで見る
          </button>
        </div>
      )}
      
      {/* デスクトップは並列表示、モバイルはタブ切替 */}
      <div className={clsx(
        isMobile ? 'block' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'
      )}>
        <div className={clsx(
          isMobile && activeTab !== 'map' && 'hidden'
        )}>
          <JapanMap wordId={wordId} />
        </div>
        
        <div className={clsx(
          isMobile && activeTab !== 'chart' && 'hidden'
        )}>
          <NationalChart stats={nationalStats} />
        </div>
      </div>
    </div>
  );
}
```

## 8. パフォーマンス最適化

### 8.1 コード分割
```typescript
// 遅延ローディング
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const WordDetailPage = lazy(() => import('@/app/words/[id]/page'));

// ECharts動的ロード
const loadECharts = async () => {
  const echarts = await import('echarts');
  const japan = await import('@/data/japan-geo.json');
  echarts.registerMap('japan', japan);
  return echarts;
};
```

### 8.2 画像最適化
```typescript
// Next.js Image コンポーネントの使用
import Image from 'next/image';

export function WordIllustration({ word }: { word: string }) {
  return (
    <Image
      src={`/images/words/${word}.webp`}
      alt={`${word}のイラスト`}
      width={300}
      height={200}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      className="rounded-lg"
    />
  );
}
```

### 8.3 メモ化最適化
```typescript
// 重い計算のメモ化
const MemoizedAccentPattern = memo(AccentPattern, (prevProps, nextProps) => {
  return (
    prevProps.pattern.join(',') === nextProps.pattern.join(',') &&
    prevProps.moraSegments.join(',') === nextProps.moraSegments.join(',') &&
    prevProps.dropPosition === nextProps.dropPosition
  );
});

// フック内でのuseMemo使用
export function useWordStats(wordId: string) {
  const { data: rawStats } = useQuery({
    queryKey: ['word-stats', wordId],
    queryFn: () => api.getWordStats(wordId)
  });
  
  const processedStats = useMemo(() => {
    if (!rawStats) return null;
    
    return {
      ...rawStats,
      mapData: processMapData(rawStats.prefectureStats),
      sortedPrefectures: rawStats.prefectureStats
        .sort((a, b) => b.totalVotes - a.totalVotes)
    };
  }, [rawStats]);
  
  return processedStats;
}
```

## 9. テスト戦略

### 9.1 コンポーネントテスト
```typescript
// AccentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AccentCard } from '@/components/features/accent/AccentCard';

describe('AccentCard', () => {
  const mockAccentOption = {
    id: 1,
    accentType: { code: 'atamadaka', name: '頭高型' },
    pattern: [1, 0, 0],
    dropPosition: 1
  };
  
  test('アクセント型名が表示される', () => {
    render(<AccentCard accentOption={mockAccentOption} />);
    expect(screen.getByText('頭高型')).toBeInTheDocument();
  });
  
  test('投票ボタンクリックでonVoteが呼ばれる', () => {
    const mockOnVote = jest.fn();
    render(
      <AccentCard 
        accentOption={mockAccentOption} 
        onVote={mockOnVote}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /投票する/ }));
    expect(mockOnVote).toHaveBeenCalledWith(1);
  });
  
  test('disabled時はクリックできない', () => {
    const mockOnVote = jest.fn();
    render(
      <AccentCard 
        accentOption={mockAccentOption} 
        onVote={mockOnVote}
        disabled
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /投票する/ }));
    expect(mockOnVote).not.toHaveBeenCalled();
  });
});
```

### 9.2 フックテスト
```typescript
// useVote.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVote } from '@/hooks/api/useWords';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useVote', () => {
  test('投票成功時にキャッシュが更新される', async () => {
    const { result } = renderHook(() => useVote(), {
      wrapper: createWrapper()
    });
    
    const voteData = {
      wordId: 1,
      accentTypeId: 1,
      prefecture: '13',
      ageGroup: '30s',
      turnstileToken: 'test-token'
    };
    
    result.current.mutate(voteData);
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

## 10. アクセシビリティ対応

### 10.1 キーボードナビゲーション
```typescript
export function AccentCard({ onVote, accentOption, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onVote?.(accentOption.id);
      }
    }
  };
  
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onClick={() => !disabled && onVote?.(accentOption.id)}
      aria-disabled={disabled}
      aria-label={`${accentOption.accentType.name}に投票`}
      className={clsx(
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* カード内容 */}
    </div>
  );
}
```

### 10.2 スクリーンリーダー対応
```typescript
export function JapanMap({ prefectureData, onPrefectureClick }: Props) {
  return (
    <div>
      <div
        role="img"
        aria-label="日本地図 - 都道府県別アクセント分布"
        ref={chartRef}
        className="w-full h-96"
      />
      
      {/* スクリーンリーダー用のテーブル */}
      <table className="sr-only">
        <caption>都道府県別投票結果</caption>
        <thead>
          <tr>
            <th>都道府県</th>
            <th>最多アクセント型</th>
            <th>投票数</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prefectureData).map(([code, data]) => (
            <tr key={code}>
              <td>{getPrefectureName(code)}</td>
              <td>{getAccentTypeName(data.dominantAccent)}</td>
              <td>{data.totalVotes}票</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

この設計書により、実装チームは効率的に開発を進めることができ、アクセシブルで高パフォーマンスなアプリケーションを構築できます。

I will also generate the following answer based on CLAUDE.md

提供いただいた仕様書を元に、日本語アクセント投票サイトの詳細な技術仕様書を作成しました。以下の4つのファイルを `ref/product/design/` ディレクトリに保存いたしました：

## 作成した仕様書ファイル

1. **accent_vote_site_spec.md** - メイン仕様書
   - 11の主要機能の詳細仕様（入出力・処理・エラー処理）
   - ビジネスルール・非機能要件の明確化
   - 開発フェーズの定義

2. **database_schema.sql** - データベース設計
   - 完全なテーブル定義（12テーブル）
   - インデックス・トリガー・ビューの実装
   - セキュリティ設定（RLS）とバッチ処理定義

3. **api_specification.md** - API仕様書
   - 40個のエンドポイントの詳細定義
   - TypeScript型定義付きのリクエスト/レスポンス仕様
   - 認証・レート制限・エラーハンドリング

4. **frontend_architecture.md** - フロントエンド設計書
   - Next.js 14 + TypeScript を中心とした技術スタック
   - コンポーネント設計・状態管理・ルーティング設計
   - モーラ分割アルゴリズムの実装コード

## 特に重要な追加設計項目

### モーラ分割アルゴリズム
拗音（ャュョ等）の正確な処理を含む日本語特有の音韻処理を実装

### アクセント型の可視化システム
4つのアクセント型（頭高・平板・中高・尾高）を線描画で表現するSVG実装

### デバイス識別による重複投票制御
Cookie + LocalStorage を組み合わせた1デバイス1票システム

### 都道府県別統計の自動集計システム
投票時のリアルタイム統計更新とパフォーマンス最適化

## 確認が必要な項目

仕様書内の「11. 確認が必要な項目」に記載した通り、以下について実装前に詳細確認をお願いします：

1. アクセント型線描画の具体的なデザイン仕様
2. 地図の色分け詳細（4アクセント型の色割り当て）
3. 個人情報保護法への対応方針
4. 管理者アカウントの運用方針
5. エラーメッセージの具体的な文言
6. 承認通知メールのテンプレート
7. GDPR対応でのデータ削除手順

これらの仕様書を基に、開発チームは段階的な実装が可能です。不明な点や追加の詳細化が必要な部分がございましたら、お知らせください。