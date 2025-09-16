'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PollList } from '@/components/features/polls/PollList';
import { SearchBar } from '@/components/features/search/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePolls } from '@/hooks/usePolls';
import { TrendingUp, Clock, Users } from 'lucide-react';

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

  const handleSortChange = (value: string) => {
    setSortBy(value as 'trending' | 'new' | 'voteCount');
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
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">並び替え:</label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voteCount">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    投票数
                  </div>
                </SelectItem>
                <SelectItem value="trending">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    急上昇
                  </div>
                </SelectItem>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    新着
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order Toggle */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-order" className="text-sm font-medium">
              表示順:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">昇順</span>
              <Switch
                id="sort-order"
                checked={sortOrder === 'desc'}
                onCheckedChange={handleSortOrderToggle}
              />
              <span className="text-sm text-muted-foreground">降順</span>
            </div>
          </div>

          {/* Active Polls Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="active-filter" className="text-sm font-medium">
              投票期間フィルタ:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">期間外</span>
              <Switch
                id="active-filter"
                checked={showActivePollsOnly}
                onCheckedChange={handleActiveToggle}
              />
              <span className="text-sm text-muted-foreground">期間中</span>
            </div>
          </div>
        </div>
      </div>

      {/* Poll List */}
      <div>
        <PollList
          polls={polls}
          loading={isLoading}
          columns={3}
        />
      </div>
    </div>
  );
}
