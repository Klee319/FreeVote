'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Poll, PollStatus, PollCategory } from '@/types/polls';

// ステータスに応じた色を返す
function getStatusColor(status: PollStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'ended':
      return 'bg-gray-500';
    case 'draft':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

// ステータスに応じたラベルを返す
function getStatusLabel(status: PollStatus): string {
  switch (status) {
    case 'active':
      return '投票受付中';
    case 'ended':
      return '終了';
    case 'draft':
      return '下書き';
    default:
      return '';
  }
}

// カテゴリに応じたラベルを返す
function getCategoryLabel(category: PollCategory): string {
  const labels: Record<PollCategory, string> = {
    general: '一般',
    tech: '技術',
    culture: '文化',
    lifestyle: 'ライフスタイル',
    entertainment: 'エンタメ',
    education: '教育',
    business: 'ビジネス',
    other: 'その他'
  };
  return labels[category] || category;
}

// 投票カードコンポーネント
function PollCard({ poll }: { poll: Poll }) {
  const isActive = poll.status === 'active';
  const daysLeft = poll.endDate ? Math.ceil((new Date(poll.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <Link href={`/polls/${poll.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(poll.category)}
            </Badge>
            <Badge className={`${getStatusColor(poll.status)} text-white`}>
              {getStatusLabel(poll.status)}
            </Badge>
          </div>
          <CardTitle className="text-xl line-clamp-2">{poll.title}</CardTitle>
          {poll.description && (
            <CardDescription className="line-clamp-2">
              {poll.description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span>{poll.totalVotes}票</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{poll.optionCount}個の選択肢</span>
            </div>
          </div>
          
          {isActive && daysLeft !== null && daysLeft <= 3 && (
            <div className="mt-3 flex items-center gap-1 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>あと{daysLeft}日で終了</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-xs text-muted-foreground">
          <span>{poll.uniqueVoters}人が参加</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

// 投票カードのスケルトン
function PollCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-3 w-20" />
      </CardFooter>
    </Card>
  );
}

// 投票一覧コンテンツ
function PollsListContent() {
  const searchParams = useSearchParams();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<PollCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'ending_soon'>(
    (searchParams.get('sort') as any) || 'recent'
  );

  // 投票データ取得
  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('sort', sortBy);
        params.append('status', 'active');
        
        const response = await fetch(`/api/polls?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setPolls(data.polls || []);
        }
      } catch (error) {
        console.error('投票データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolls();
  }, [searchQuery, selectedCategory, sortBy]);

  // 検索処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索実行（useEffectで自動的に再取得される）
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">投票一覧</h1>
        <p className="text-muted-foreground">
          様々なトピックについて投票に参加しよう
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="投票を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">検索</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as PollCategory | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="general">一般</SelectItem>
              <SelectItem value="tech">技術</SelectItem>
              <SelectItem value="culture">文化</SelectItem>
              <SelectItem value="lifestyle">ライフスタイル</SelectItem>
              <SelectItem value="entertainment">エンタメ</SelectItem>
              <SelectItem value="education">教育</SelectItem>
              <SelectItem value="business">ビジネス</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <TabsList>
              <TabsTrigger value="recent" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                最新
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                人気
              </TabsTrigger>
              <TabsTrigger value="ending_soon" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                終了間近
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 投票一覧 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // ローディング表示
          Array.from({ length: 6 }).map((_, index) => (
            <PollCardSkeleton key={index} />
          ))
        ) : polls.length === 0 ? (
          // 結果なし
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              該当する投票が見つかりませんでした
            </p>
          </div>
        ) : (
          // 投票カード表示
          polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))
        )}
      </div>
    </div>
  );
}

// メインコンポーネント
export default function PollsListPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PollCardSkeleton key={index} />
          ))}
        </div>
      </div>
    }>
      <PollsListContent />
    </Suspense>
  );
}