'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RankingPollList } from '@/components/features/polls/RankingPollList';
import { SearchBar } from '@/components/features/search/SearchBar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePolls } from '@/hooks/usePolls';
import { TrendingUp, Clock, Users, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const searchParams = useSearchParams();
  const { polls, isLoading, fetchPolls } = usePolls();

  // State for filters and sorting
  const [sortBy, setSortBy] = useState<'trending' | 'new' | 'voteCount'>('voteCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showActivePollsOnly, setShowActivePollsOnly] = useState(true);

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const params: any = {
      sort: sortBy,
      order: sortOrder,
      active: showActivePollsOnly,
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    fetchPolls(params);
  }, [searchQuery, sortBy, sortOrder, showActivePollsOnly, fetchPolls]);

  const handleSortChange = (value: 'trending' | 'new' | 'voteCount') => {
    setSortBy(value);
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleActiveToggle = () => {
    setShowActivePollsOnly((prev) => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar at the top */}
      <div className="mb-8">
        <SearchBar />
      </div>

      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            「{searchQuery}」の検索結果
          </h2>
          <p className="text-muted-foreground mt-1">
            {polls.length}件の投票が見つかりました
          </p>
        </div>
      )}

      {/* Sort and Filter Controls */}
      <div className="mb-8 space-y-4">
        {/* セグメンテッドコントロール（並び替え） */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" />
            並び替え
          </label>
          <div className="inline-flex rounded-lg border p-1 bg-muted/30">
            <Button
              variant={sortBy === 'voteCount' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('voteCount')}
              className={cn(
                "rounded-md transition-all",
                sortBy === 'voteCount'
                  ? "shadow-sm"
                  : "hover:bg-transparent hover:text-primary"
              )}
            >
              <Users className="w-4 h-4 mr-2" />
              投票数順
            </Button>
            <Button
              variant={sortBy === 'new' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('new')}
              className={cn(
                "rounded-md transition-all",
                sortBy === 'new'
                  ? "shadow-sm"
                  : "hover:bg-transparent hover:text-primary"
              )}
            >
              <Clock className="w-4 h-4 mr-2" />
              新着順
            </Button>
            <Button
              variant={sortBy === 'trending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('trending')}
              className={cn(
                "rounded-md transition-all",
                sortBy === 'trending'
                  ? "shadow-sm"
                  : "hover:bg-transparent hover:text-primary"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              締切間近
            </Button>
          </div>
        </div>

        {/* フィルターオプション */}
        <div className="flex flex-wrap items-center gap-6">
          {/* 表示順 */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort-order" className="text-sm font-medium">
              表示順:
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1 bg-background">
              <span className={cn(
                "text-sm transition-colors",
                sortOrder === 'asc' ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                昇順
              </span>
              <Switch
                id="sort-order"
                checked={sortOrder === 'desc'}
                onCheckedChange={handleSortOrderToggle}
                className="data-[state=checked]:bg-primary"
              />
              <span className={cn(
                "text-sm transition-colors",
                sortOrder === 'desc' ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                降順
              </span>
            </div>
          </div>

          {/* 投票期間フィルタ */}
          <div className="flex items-center gap-3">
            <label htmlFor="active-filter" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              期間:
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1 bg-background">
              <span className={cn(
                "text-sm transition-colors",
                !showActivePollsOnly ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                すべて
              </span>
              <Switch
                id="active-filter"
                checked={showActivePollsOnly}
                onCheckedChange={handleActiveToggle}
                className="data-[state=checked]:bg-primary"
              />
              <span className={cn(
                "text-sm transition-colors",
                showActivePollsOnly ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                期間中のみ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking Poll List */}
      <div>
        <RankingPollList
          polls={polls}
          loading={isLoading}
          showTrending={sortBy === 'trending'}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
}
