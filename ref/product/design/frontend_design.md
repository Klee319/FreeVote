# フロントエンド詳細設計書

## 1. フロントエンド設計概要

### 1.1 設計方針
- **コンポーネント指向**: 再利用可能な小さなコンポーネント設計
- **型安全性**: TypeScriptによる厳密な型チェック
- **アクセシビリティ**: WCAG 2.1 AA準拠のユニバーサルデザイン
- **パフォーマンス**: Code Splitting、Lazy Loading、画像最適化
- **SEO最適化**: SSR/SSG/ISRの適切な使い分け
- **レスポンシブ**: モバイルファーストなデザイン

### 1.2 技術スタック詳細
| カテゴリ | 技術 | バージョン | 選定理由 |
|----------|------|-----------|----------|
| フレームワーク | Next.js | 14.x | App Router、SSR/SSG/ISR、自動最適化 |
| UI ライブラリ | React | 18.x | コンポーネント指向、豊富なエコシステム |
| 言語 | TypeScript | 5.x | 型安全性、開発効率、実行時エラー削減 |
| スタイリング | Tailwind CSS | 3.x | ユーティリティファースト、高速開発 |
| UIコンポーネント | shadcn/ui | latest | アクセシブル、カスタマイズ性、型安全 |
| 状態管理 | Zustand | 4.x | 軽量、シンプルAPI、TypeScript対応 |
| データ取得 | TanStack Query | 5.x | キャッシュ、楽観的更新、背景更新 |
| フォーム | React Hook Form | 7.x | パフォーマンス、バリデーション |
| バリデーション | Zod | 3.x | TypeScript連携、ランタイム検証 |
| アニメーション | Framer Motion | 11.x | 宣言的アニメーション、ジェスチャー |
| アイコン | Lucide React | latest | 軽量、カスタマイズ可能 |
| 地図表示 | React Simple Maps | 3.x | SVGベース、軽量、カスタマイズ性 |
| 音声合成 | Web Speech API | - | ブラウザ標準、アクセント再現 |

## 2. ディレクトリ構成

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認証レイアウト
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/                  # メインレイアウト
│   │   ├── page.tsx             # トップページ
│   │   ├── polls/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # 投票詳細
│   │   │   │   └── stats/
│   │   │   │       └── page.tsx # 統計ページ
│   │   │   └── page.tsx         # 投票一覧
│   │   ├── request/
│   │   │   └── page.tsx         # 投票提案
│   │   ├── search/
│   │   │   └── page.tsx         # 検索
│   │   └── layout.tsx
│   ├── admin/                   # 管理画面
│   │   ├── dashboard/
│   │   ├── polls/
│   │   ├── requests/
│   │   ├── users/
│   │   └── layout.tsx
│   ├── api/                     # API Routes
│   │   └── proxy/               # プロキシAPI
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # ルートレイアウト
│   └── providers.tsx            # プロバイダー設定
├── components/                  # コンポーネント
│   ├── ui/                     # shadcn/ui基本コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── features/               # 機能別コンポーネント
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── SocialLoginButton.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── polls/
│   │   │   ├── PollCard.tsx
│   │   │   ├── PollList.tsx
│   │   │   ├── VoteForm.tsx
│   │   │   ├── PollResults.tsx
│   │   │   ├── PollFilters.tsx
│   │   │   └── PollSearch.tsx
│   │   ├── stats/
│   │   │   ├── StatisticsChart.tsx
│   │   │   ├── JapanMap.tsx
│   │   │   ├── DemographicChart.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── accent/
│   │   │   ├── AccentPlayer.tsx
│   │   │   ├── PitchPattern.tsx
│   │   │   └── VoiceSample.tsx
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── PollEditor.tsx
│   │   │   ├── RequestManager.tsx
│   │   │   └── Dashboard.tsx
│   │   └── share/
│   │       ├── ShareButton.tsx
│   │       ├── ShareModal.tsx
│   │       └── ReferralTracker.tsx
│   └── layout/                 # レイアウトコンポーネント
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── LoadingSpinner.tsx
├── hooks/                      # カスタムフック
│   ├── api/                   # API関連フック
│   │   ├── usePolls.ts
│   │   ├── useVote.ts
│   │   ├── useStats.ts
│   │   ├── useAuth.ts
│   │   └── useReferrals.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useResponsive.ts
│   ├── useAccentPlayer.ts
│   └── useShareHandler.ts
├── stores/                     # Zustand ストア
│   ├── authStore.ts
│   ├── pollStore.ts
│   ├── uiStore.ts
│   ├── settingsStore.ts
│   └── index.ts
├── lib/                        # ユーティリティ
│   ├── api.ts                 # API クライアント
│   ├── auth.ts                # 認証ヘルパー
│   ├── utils.ts               # 一般的なユーティリティ
│   ├── validations.ts         # バリデーションスキーマ
│   ├── constants.ts           # 定数定義
│   ├── prefectures.ts         # 都道府県データ
│   └── speech.ts              # 音声合成ヘルパー
├── types/                      # 型定義
│   ├── api.ts                 # API レスポンス型
│   ├── poll.ts                # 投票関連型
│   ├── user.ts                # ユーザー関連型
│   ├── ui.ts                  # UI関連型
│   └── global.ts              # グローバル型
├── styles/                     # スタイル
│   ├── globals.css
│   ├── components.css
│   └── utilities.css
└── public/                     # 静的ファイル
    ├── images/
    ├── icons/
    ├── audio/
    └── data/
        └── japan.json         # 日本地図データ
```

## 3. ページ設計

### 3.1 トップページ (/)

#### 3.1.1 ページ構成
```tsx
// app/(main)/page.tsx
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrendingPolls />
      <CategoryTabs />
      <RecentPolls />
      <ReferralRanking />
      <Footer />
    </>
  );
}
```

#### 3.1.2 コンポーネント設計
```tsx
interface HeroSectionProps {
  featuredPoll?: Poll;
  totalVotes: number;
  totalUsers: number;
}

interface TrendingPollsProps {
  polls: Poll[];
  isLoading: boolean;
}

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}
```

#### 3.1.3 SEO最適化
```tsx
// メタデータ生成
export const metadata: Metadata = {
  title: 'みんなの投票 - 誰でも参加できる投票プラットフォーム',
  description: 'アクセント投票から時事問題まで、様々なテーマで投票に参加できます。結果を地図で確認したり、SNSでシェアして友達と楽しもう！',
  keywords: ['投票', 'アンケート', 'アクセント', '方言', '世論調査'],
  openGraph: {
    title: 'みんなの投票',
    description: '誰でも参加できる投票プラットフォーム',
    images: ['/images/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'みんなの投票',
    description: '誰でも参加できる投票プラットフォーム',
    images: ['/images/twitter-card.png'],
  },
};
```

### 3.2 投票詳細ページ (/polls/[id])

#### 3.2.1 ページ構成
```tsx
// app/(main)/polls/[id]/page.tsx
interface PollDetailPageProps {
  params: { id: string };
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const { data: poll, isLoading } = usePoll(params.id);

  if (isLoading) return <PollDetailSkeleton />;
  if (!poll) return <NotFound />;

  return (
    <>
      <PollHeader poll={poll} />
      <VoteSection poll={poll} />
      <ResultsSection poll={poll} />
      <ShareSection poll={poll} />
      <RelatedPolls pollId={poll.id} />
    </>
  );
}
```

#### 3.2.2 投票フォーム設計
```tsx
interface VoteFormProps {
  poll: Poll;
  onVote: (option: number, demographics?: Demographics) => Promise<void>;
  canVote: boolean;
  userVote?: UserVote;
}

const VoteForm: React.FC<VoteFormProps> = ({ poll, onVote, canVote, userVote }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showDemographics, setShowDemographics] = useState(false);
  const { user } = useAuth();

  const handleVote = async () => {
    if (!user && selectedOption !== null) {
      setShowDemographics(true);
      return;
    }

    await onVote(selectedOption!);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {poll.options.map((option, index) => (
          <VoteOption
            key={index}
            option={option}
            index={index}
            selected={selectedOption === index}
            onSelect={setSelectedOption}
            disabled={!canVote}
            showResults={!!userVote}
            voteCount={poll.results?.distribution[index]?.count || 0}
            percentage={poll.results?.distribution[index]?.percentage || 0}
          />
        ))}
      </div>

      {canVote && (
        <Button
          onClick={handleVote}
          disabled={selectedOption === null}
          className="w-full mt-6"
        >
          投票する
        </Button>
      )}

      <DemographicsModal
        open={showDemographics}
        onClose={() => setShowDemographics(false)}
        onSubmit={(demographics) => onVote(selectedOption!, demographics)}
      />
    </Card>
  );
};
```

#### 3.2.3 アクセント投票コンポーネント
```tsx
interface AccentVoteOptionProps {
  option: PollOption;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}

const AccentVoteOption: React.FC<AccentVoteOptionProps> = ({
  option,
  index,
  selected,
  onSelect
}) => {
  const { playAccent, isPlaying } = useAccentPlayer();

  return (
    <div
      className={cn(
        "border rounded-lg p-4 cursor-pointer transition-all",
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      )}
      onClick={() => onSelect(index)}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{option.label}</span>
        {option.voiceSampleUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              playAccent(option.voiceSampleUrl!);
            }}
            disabled={isPlaying}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {option.pitchPattern && (
        <PitchPattern
          pattern={option.pitchPattern}
          text={option.label}
          className="mt-3"
        />
      )}
    </div>
  );
};
```

### 3.3 統計ページ (/polls/[id]/stats)

#### 3.3.1 ページ構成
```tsx
// app/(main)/polls/[id]/stats/page.tsx
export default function StatsPage({ params }: { params: { id: string } }) {
  const { data: stats, isLoading } = usePollStats(params.id);
  const [filterBy, setFilterBy] = useState<'age' | 'gender' | 'prefecture'>('age');

  return (
    <>
      <StatsHeader poll={stats?.poll} />
      <StatsFilters filterBy={filterBy} onFilterChange={setFilterBy} />
      <StatsOverview stats={stats?.overview} />
      <ChartsSection stats={stats} filterBy={filterBy} />
      <MapSection pollId={params.id} />
      <TrendsSection stats={stats?.trends} />
    </>
  );
}
```

#### 3.3.2 地図コンポーネント設計
```tsx
interface JapanMapProps {
  data: MapData[];
  colorScale: Record<number, string>;
  onPrefectureClick?: (prefecture: string) => void;
}

const JapanMap: React.FC<JapanMapProps> = ({ data, colorScale, onPrefectureClick }) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  return (
    <div className="relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1400,
          center: [139, 36]
        }}
      >
        <Geographies geography="/data/japan.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const prefecture = geo.properties.NAME;
              const prefectureData = data.find(d => d.prefecture === prefecture);
              const fillColor = prefectureData
                ? colorScale[prefectureData.topOption]
                : '#f3f4f6';

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  onMouseEnter={() => setHoveredPrefecture(prefecture)}
                  onMouseLeave={() => setHoveredPrefecture(null)}
                  onClick={() => onPrefectureClick?.(prefecture)}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      outline: 'none',
                      filter: 'brightness(1.1)'
                    },
                    pressed: { outline: 'none' }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hoveredPrefecture && (
        <PrefectureTooltip
          prefecture={hoveredPrefecture}
          data={data.find(d => d.prefecture === hoveredPrefecture)}
        />
      )}
    </div>
  );
};
```

### 3.4 管理画面 (/admin)

#### 3.4.1 レイアウト設計
```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <AdminHeader />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

#### 3.4.2 投票作成フォーム
```tsx
interface PollEditorProps {
  poll?: Poll;
  onSave: (pollData: CreatePollRequest) => Promise<void>;
}

const PollEditor: React.FC<PollEditorProps> = ({ poll, onSave }) => {
  const form = useForm<CreatePollRequest>({
    resolver: zodResolver(createPollSchema),
    defaultValues: poll || {
      title: '',
      description: '',
      isAccentMode: false,
      options: [{ label: '' }, { label: '' }],
      categories: [],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options'
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input {...field} placeholder="投票のタイトルを入力" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAccentMode"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>アクセント投票モード</FormLabel>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <Label>選択肢</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name={`options.${index}.label`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder={`選択肢 ${index + 1}`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  削除
                </Button>
              )}
            </div>
          ))}

          {fields.length < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ label: '' })}
            >
              選択肢を追加
            </Button>
          )}
        </div>

        <PollPreview poll={form.watch()} />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline">
            プレビュー
          </Button>
          <Button type="submit">
            {poll ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

## 4. 状態管理設計

### 4.1 Zustand ストア設計

#### 4.1.1 認証ストア
```tsx
interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,

        login: async (credentials) => {
          set({ isLoading: true });
          try {
            const response = await authApi.login(credentials);
            set({
              user: response.user,
              tokens: response.tokens,
              isAuthenticated: true,
              isLoading: false
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        logout: () => {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false
          });
          localStorage.removeItem('userToken');
        },

        refreshToken: async () => {
          const { tokens } = get();
          if (!tokens?.refreshToken) return;

          try {
            const response = await authApi.refreshToken(tokens.refreshToken);
            set({
              tokens: {
                ...tokens,
                accessToken: response.accessToken
              }
            });
          } catch (error) {
            get().logout();
            throw error;
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
);
```

#### 4.1.2 投票ストア
```tsx
interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  filters: PollFilters;
  pagination: PaginationInfo;
  isLoading: boolean;
}

interface PollActions {
  fetchPolls: (params?: FetchPollsParams) => Promise<void>;
  fetchPoll: (id: string) => Promise<void>;
  vote: (pollId: string, option: number, demographics?: Demographics) => Promise<void>;
  setFilters: (filters: Partial<PollFilters>) => void;
  clearPolls: () => void;
}

export const usePollStore = create<PollState & PollActions>()(
  devtools((set, get) => ({
    polls: [],
    currentPoll: null,
    filters: {
      category: '',
      sort: 'trending',
      search: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    isLoading: false,

    fetchPolls: async (params) => {
      set({ isLoading: true });
      try {
        const response = await pollApi.getPolls(params);
        set({
          polls: response.polls,
          pagination: response.pagination,
          isLoading: false
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    vote: async (pollId, option, demographics) => {
      const userToken = localStorage.getItem('userToken');
      const response = await pollApi.vote(pollId, {
        option,
        ...demographics,
        userToken
      });

      if (response.userToken) {
        localStorage.setItem('userToken', response.userToken);
      }

      // 現在の投票を更新
      const { currentPoll } = get();
      if (currentPoll?.id === pollId) {
        set({
          currentPoll: {
            ...currentPoll,
            results: response.results,
            userVote: { option, votedAt: new Date().toISOString() }
          }
        });
      }
    }
  }))
);
```

#### 4.1.3 UI状態ストア
```tsx
interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: Record<string, boolean>;
}

interface UiActions {
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const useUiStore = create<UiState & UiActions>()(
  devtools((set, get) => ({
    sidebarOpen: false,
    theme: 'light',
    notifications: [],
    loading: {},

    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    setTheme: (theme) => {
      set({ theme });
      document.documentElement.setAttribute('data-theme', theme);
    },

    addNotification: (notification) => {
      const id = Math.random().toString(36).substr(2, 9);
      set((state) => ({
        notifications: [...state.notifications, { ...notification, id }]
      }));

      // 自動削除
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },

    setLoading: (key, loading) => {
      set((state) => ({
        loading: { ...state.loading, [key]: loading }
      }));
    }
  }))
);
```

### 4.2 TanStack Query設定

#### 4.2.1 QueryClient設定
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 30,   // 30分
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      }
    },
    mutations: {
      retry: 1
    }
  }
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 4.2.2 カスタムフック
```tsx
// 投票一覧取得
export function usePolls(params?: FetchPollsParams) {
  return useQuery({
    queryKey: ['polls', params],
    queryFn: () => pollApi.getPolls(params),
    staleTime: 1000 * 60 * 2, // 2分
  });
}

// 投票詳細取得
export function usePoll(id: string) {
  return useQuery({
    queryKey: ['poll', id],
    queryFn: () => pollApi.getPoll(id),
    enabled: !!id,
  });
}

// 投票実行
export function useVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, voteData }: { pollId: string; voteData: VoteRequest }) =>
      pollApi.vote(pollId, voteData),
    onSuccess: (data, variables) => {
      // 投票詳細を更新
      queryClient.setQueryData(['poll', variables.pollId], (old: any) => ({
        ...old,
        results: data.results,
        userVote: { option: variables.voteData.option, votedAt: new Date().toISOString() }
      }));

      // 投票一覧も更新（楽観的更新）
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    }
  });
}

// 統計データ取得
export function usePollStats(pollId: string, filterBy?: string) {
  return useQuery({
    queryKey: ['poll-stats', pollId, filterBy],
    queryFn: () => pollApi.getStats(pollId, { filterBy }),
    enabled: !!pollId,
    staleTime: 1000 * 60 * 10, // 10分
  });
}
```

## 5. コンポーネント設計

### 5.1 共通UIコンポーネント

#### 5.1.1 Button拡張
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);
```

#### 5.1.2 モーダルコンポーネント
```tsx
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onOpenChange, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(modalSizes[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.2 機能別コンポーネント

#### 5.2.1 投票カードコンポーネント
```tsx
interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string) => void;
  showResults?: boolean;
  compact?: boolean;
}

export function PollCard({ poll, onVote, showResults = false, compact = false }: PollCardProps) {
  const { user } = useAuth();
  const voteMutation = useVoteMutation();

  const handleQuickVote = async (option: number) => {
    if (!user) {
      // ゲストユーザーは詳細ページへ
      onVote?.(poll.id);
      return;
    }

    await voteMutation.mutateAsync({
      pollId: poll.id,
      voteData: { option }
    });
  };

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", compact && "p-4")}>
      {poll.thumbnailUrl && (
        <div className="aspect-video relative">
          <Image
            src={poll.thumbnailUrl}
            alt={poll.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <CardContent className={cn("p-6", compact && "p-4")}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={cn("font-semibold line-clamp-2", compact ? "text-base" : "text-lg")}>
            {poll.title}
          </h3>
          {poll.isAccentMode && (
            <Badge variant="secondary">
              <Volume2 className="w-3 h-3 mr-1" />
              アクセント
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {poll.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>{poll.voteCount}票</span>
          <span>締切: {formatDate(poll.deadline)}</span>
        </div>

        {poll.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {poll.categories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        )}

        {showResults && poll.previewResults ? (
          <div className="space-y-2">
            {poll.previewResults.quickStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{poll.options[stat.option].label}</span>
                <span className="text-sm font-medium">{stat.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {poll.options.slice(0, 2).map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleQuickVote(index)}
                loading={voteMutation.isPending}
              >
                {option.label}
              </Button>
            ))}
            {poll.options.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onVote?.(poll.id)}
              >
                他{poll.options.length - 2}件の選択肢を見る
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 5.2.2 アクセント再生コンポーネント
```tsx
interface AccentPlayerProps {
  text: string;
  pitchPattern: number[];
  voiceSampleUrl?: string;
  autoPlay?: boolean;
}

export function AccentPlayer({ text, pitchPattern, voiceSampleUrl, autoPlay = false }: AccentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const playAccent = useCallback(async () => {
    if (isPlaying) return;

    setIsPlaying(true);

    try {
      if (voiceSampleUrl) {
        // 事前録音された音声を再生
        const audio = new Audio(voiceSampleUrl);
        audio.playbackRate = playbackSpeed;
        await audio.play();
        audio.onended = () => setIsPlaying(false);
      } else {
        // Web Speech APIで合成
        await synthesizeAccent(text, pitchPattern, playbackSpeed);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('音声再生エラー:', error);
      setIsPlaying(false);
    }
  }, [text, pitchPattern, voiceSampleUrl, playbackSpeed, isPlaying]);

  useEffect(() => {
    if (autoPlay) {
      playAccent();
    }
  }, [autoPlay, playAccent]);

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={playAccent}
        disabled={isPlaying}
        icon={isPlaying ? <Loader2 className="animate-spin" /> : <Play />}
      >
        {isPlaying ? '再生中...' : '再生'}
      </Button>

      <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(Number(value))}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">0.5x</SelectItem>
          <SelectItem value="1">1x</SelectItem>
          <SelectItem value="1.5">1.5x</SelectItem>
          <SelectItem value="2">2x</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## 6. レスポンシブ設計

### 6.1 ブレークポイント定義
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Tailwind CSS設定
module.exports = {
  theme: {
    screens: breakpoints,
    extend: {
      // カスタムブレークポイント
      'xs': '475px',
      '3xl': '1920px'
    }
  }
};
```

### 6.2 レスポンシブフック
```tsx
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize
  };
}
```

### 6.3 レスポンシブレイアウト
```tsx
// ヘッダーコンポーネント
export function Header() {
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavigationMenu />
          </nav>

          {/* デスクトップ右側 */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchButton />
            <UserMenu />
          </div>

          {/* モバイルメニューボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* モバイルメニュー */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-white"
          >
            <div className="container mx-auto px-4 py-4">
              <MobileNavigation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
```

## 7. パフォーマンス最適化

### 7.1 Code Splitting
```tsx
// 動的インポート
const AdminDashboard = lazy(() => import('@/components/admin/Dashboard'));
const PollEditor = lazy(() => import('@/components/admin/PollEditor'));
const StatsChart = lazy(() => import('@/components/stats/StatsChart'));

// ルートレベルでの分割
const AdminRoutes = lazy(() => import('@/app/admin/page'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminRoutes />
    </Suspense>
  );
}
```

### 7.2 画像最適化
```tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ src, alt, width, height, priority = false, className }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### 7.3 仮想化リスト
```tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedPollListProps {
  polls: Poll[];
  onPollClick: (poll: Poll) => void;
}

export function VirtualizedPollList({ polls, onPollClick }: VirtualizedPollListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PollCard poll={polls[index]} onVote={() => onPollClick(polls[index])} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={polls.length}
      itemSize={200}
      itemData={polls}
    >
      {Row}
    </List>
  );
}
```

## 8. アクセシビリティ

### 8.1 キーボードナビゲーション
```tsx
export function PollOption({ option, index, onSelect, selected }: PollOptionProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(index);
        break;
      case 'ArrowDown':
        event.preventDefault();
        // 次の選択肢にフォーカス
        const nextOption = ref.current?.parentElement?.nextElementSibling?.querySelector('button');
        nextOption?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        // 前の選択肢にフォーカス
        const prevOption = ref.current?.parentElement?.previousElementSibling?.querySelector('button');
        prevOption?.focus();
        break;
    }
  };

  return (
    <button
      ref={ref}
      className={cn(
        "w-full p-4 text-left border rounded-lg transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      )}
      onClick={() => onSelect(index)}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-describedby={`option-${index}-description`}
    >
      <span className="font-medium">{option.label}</span>
      <span id={`option-${index}-description`} className="sr-only">
        選択肢 {index + 1}: {option.label}
      </span>
    </button>
  );
}
```

### 8.2 スクリーンリーダー対応
```tsx
export function PollResults({ results }: { results: PollResults }) {
  return (
    <div role="region" aria-labelledby="results-heading">
      <h2 id="results-heading" className="text-xl font-semibold mb-4">
        投票結果
      </h2>

      <div className="space-y-3" role="list" aria-label="投票結果一覧">
        {results.distribution.map((item, index) => (
          <div
            key={index}
            role="listitem"
            className="flex items-center justify-between p-3 border rounded"
            aria-describedby={`result-${index}-details`}
          >
            <span className="font-medium">{item.label}</span>
            <div className="flex items-center space-x-2">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{ width: `${item.percentage}%`, minWidth: '20px' }}
                role="progressbar"
                aria-valuenow={item.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label}の得票率`}
              />
              <span aria-hidden="true">{item.percentage}%</span>
            </div>
            <span id={`result-${index}-details`} className="sr-only">
              {item.label}: {item.count}票, {item.percentage}パーセント
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 9. SEO対応

### 9.1 メタデータ最適化
```tsx
// app/(main)/polls/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const poll = await getPoll(params.id);

  if (!poll) {
    return {
      title: '投票が見つかりません - みんなの投票',
    };
  }

  return {
    title: `${poll.title} - みんなの投票`,
    description: poll.description,
    keywords: [...poll.categories, '投票', 'アンケート'],
    openGraph: {
      title: poll.title,
      description: poll.description,
      images: poll.thumbnailUrl ? [poll.thumbnailUrl] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: poll.title,
      description: poll.description,
      images: poll.thumbnailUrl ? [poll.thumbnailUrl] : [],
    },
    alternates: {
      canonical: `https://vote-site.com/polls/${params.id}`,
    },
  };
}
```

### 9.2 構造化データ
```tsx
export function PollStructuredData({ poll }: { poll: Poll }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Survey",
    "name": poll.title,
    "description": poll.description,
    "url": `https://vote-site.com/polls/${poll.id}`,
    "dateCreated": poll.createdAt,
    "dateModified": poll.updatedAt,
    "expires": poll.deadline,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/VoteAction",
      "userInteractionCount": poll.voteCount
    },
    "about": poll.categories.map(category => ({
      "@type": "Thing",
      "name": category
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

## 10. エラーハンドリング

### 10.1 エラー境界
```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // エラー報告サービスに送信
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
              <p className="text-muted-foreground mb-4">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              <Button onClick={() => window.location.reload()}>
                ページを再読み込み
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 10.2 API エラーハンドリング
```tsx
export function useErrorHandler() {
  const { addNotification } = useUiStore();

  return useCallback((error: any) => {
    let message = 'エラーが発生しました';
    let variant: 'error' | 'warning' = 'error';

    if (error.response?.data?.error) {
      const { code, message: errorMessage } = error.response.data.error;

      switch (code) {
        case 'AUTH_TOKEN_EXPIRED':
          message = 'ログインの有効期限が切れました。再ログインしてください。';
          // 自動ログアウト
          useAuthStore.getState().logout();
          break;
        case 'RATE_LIMIT_EXCEEDED':
          message = 'リクエストが多すぎます。しばらく時間をおいてからお試しください。';
          variant = 'warning';
          break;
        case 'ALREADY_VOTED':
          message = 'この投票には既に参加済みです。';
          variant = 'warning';
          break;
        default:
          message = errorMessage || message;
      }
    }

    addNotification({
      type: variant,
      title: 'エラー',
      message,
      duration: 5000
    });
  }, [addNotification]);
}
```

## 11. まとめ

### 11.1 設計の特徴
1. **コンポーネント駆動**: 再利用可能で保守しやすい設計
2. **型安全性**: TypeScriptによる厳密な型チェック
3. **パフォーマンス**: 適切な最適化戦略
4. **アクセシビリティ**: WCAG準拠のユニバーサルデザイン
5. **SEO最適化**: 検索エンジン対応

### 11.2 開発効率
- Next.js 14の最新機能活用
- shadcn/uiによる統一されたUI
- TanStack Queryによる効率的なデータ管理
- Zustandによるシンプルな状態管理

### 11.3 拡張性
- プラグイン可能なアーキテクチャ
- 機能別コンポーネント分離
- 設定駆動なUI設計

この設計により、ユーザビリティと開発効率を両立した投票プラットフォームのフロントエンドを構築できます。