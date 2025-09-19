'use client';

import { useState } from 'react';
import { RankingPollCard } from './RankingPollCard';
import { RankingPollTable } from './RankingPollTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Poll } from '@/types';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

interface RankingPollListProps {
  polls: Poll[];
  loading?: boolean;
  showTrending?: boolean;
  sortBy?: 'trending' | 'new' | 'voteCount';
}

export function RankingPollList({
  polls,
  loading = false,
  showTrending = false,
  sortBy = 'voteCount'
}: RankingPollListProps) {
  const safePolls = Array.isArray(polls) ? polls : [];
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // ランキングタイトルを決定
  const getRankingTitle = () => {
    switch(sortBy) {
      case 'voteCount':
        return '人気投票ランキング';
      case 'trending':
        return '急上昇ランキング';
      case 'new':
        return '新着投票ランキング';
      default:
        return 'ランキング';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">{getRankingTitle()}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="relative">
              <div className="absolute top-0 left-0 z-10 bg-primary/10 px-3 py-2 rounded-br-xl">
                <Skeleton className="h-6 w-8" />
              </div>
              <Card className="h-full">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (safePolls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">投票が見つかりませんでした</p>
      </div>
    );
  }

  // 上位6位とそれ以降を分ける
  const topSix = safePolls.slice(0, 6);
  const remaining = safePolls.slice(6);

  // ページネーション計算
  const totalPages = Math.ceil(remaining.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = remaining.slice(startIndex, endIndex);
  const startRank = 7 + startIndex;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // ページ変更時にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* ランキングヘッダー */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Trophy className="w-8 h-8 text-primary animate-bounce" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {getRankingTitle()}
        </h2>
      </div>

      {/* トップ6をカード表示 */}
      <div className="space-y-8">
        {/* 1-3位 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {topSix.slice(0, 3).map((poll, index) => (
            <div
              key={poll.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <RankingPollCard
                poll={poll}
                rank={index + 1}
                showTrending={showTrending}
              />
            </div>
          ))}
        </div>

        {/* 4-6位 */}
        {topSix.slice(3, 6).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topSix.slice(3, 6).map((poll, index) => (
              <div
                key={poll.id}
                className="animate-fade-in"
                style={{ animationDelay: `${(index + 3) * 50}ms` }}
              >
                <RankingPollCard
                  poll={poll}
                  rank={index + 4}
                  showTrending={showTrending}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7位以降を表形式で表示 */}
      {remaining.length > 0 && (
        <>
          <div className="border-t pt-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground">
                {startRank}位〜{Math.min(startRank + currentPageItems.length - 1, safePolls.length)}位
              </h3>
              {totalPages > 1 && (
                <div className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages} ページ
                </div>
              )}
            </div>
          </div>

          <RankingPollTable
            polls={currentPageItems}
            startRank={startRank}
            showTrending={showTrending}
          />

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                前へ
              </Button>

              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }

                  if (pageNumber < 1 || pageNumber > totalPages) return null;

                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="min-w-[40px]"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                次へ
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Loading Card component
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-lg border ${className}`}>
    {children}
  </div>
);