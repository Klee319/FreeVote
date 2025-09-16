'use client';

import { useEffect, useState } from 'react';
import { PollCard } from './PollCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Poll } from '@/types';

interface PollListProps {
  polls: Poll[];
  loading?: boolean;
  showTrending?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export function PollList({
  polls,
  loading = false,
  showTrending = false,
  columns = 3
}: PollListProps) {
  // pollsが配列でない場合は空配列として扱う
  const safePolls = Array.isArray(polls) ? polls : [];
  const getGridCols = () => {
    switch(columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (loading) {
    return (
      <div className={`grid ${getGridCols()} gap-6`}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-full">
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
        ))}
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

  return (
    <div className={`grid ${getGridCols()} gap-6`}>
      {safePolls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          showTrending={showTrending}
        />
      ))}
    </div>
  );
}

// Loading Card component
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-lg border ${className}`}>
    {children}
  </div>
);