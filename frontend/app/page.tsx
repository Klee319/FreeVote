'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PollList } from '@/components/features/polls/PollList';
import { RankingSection } from '@/components/features/ranking/RankingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePolls } from '@/hooks/usePolls';
import { TrendingUp, Clock, Users, Award } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const { polls, isLoading, fetchPolls } = usePolls();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');

  const categoryParam = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const params: any = {};

    if (categoryParam && categoryParam !== 'all') {
      params.category = categoryParam;
      setSelectedCategory(categoryParam);
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    params.sort = sortBy;

    fetchPolls(params);
  }, [categoryParam, searchQuery, sortBy, fetchPolls]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params: any = { sort: sortBy };

    if (category !== 'all') {
      params.category = category;
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    fetchPolls(params);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const params: any = { sort };

    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    fetchPolls(params);
  };

  // Filter trending and new polls for hero section
  const trendingPolls = polls.slice(0, 3);
  const newPolls = polls.slice(3, 6);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      {!searchQuery && (
        <div className="mb-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Trending Polls */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-2xl font-bold">急上昇の投票</h2>
              </div>
              <PollList
                polls={trendingPolls}
                loading={isLoading}
                showTrending={true}
                columns={1}
              />
            </div>

            {/* New Polls */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                <h2 className="text-2xl font-bold">新着投票</h2>
              </div>
              <PollList
                polls={newPolls}
                loading={isLoading}
                columns={1}
              />
            </div>
          </div>

          {/* User Ranking */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-purple-500" />
              <h2 className="text-2xl font-bold">紹介ランキング</h2>
            </div>
            <RankingSection />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
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

        {/* Category Tabs and Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="accent">アクセント</TabsTrigger>
              <TabsTrigger value="entertainment">エンタメ</TabsTrigger>
              <TabsTrigger value="news">ニュース</TabsTrigger>
              <TabsTrigger value="trivia">雑学</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  急上昇順
                </div>
              </SelectItem>
              <SelectItem value="new">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  新着順
                </div>
              </SelectItem>
              <SelectItem value="voteCount">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  投票数順
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Poll List */}
        <PollList
          polls={polls}
          loading={isLoading}
          columns={3}
        />
      </div>
    </div>
  );
}
