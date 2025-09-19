'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { Poll } from '@/types';
import { cn } from '@/lib/utils';

interface RankingPollTableProps {
  polls: Poll[];
  startRank: number;
  showTrending?: boolean;
}

export function RankingPollTable({ polls, startRank, showTrending = false }: RankingPollTableProps) {
  const calculateTimeRemaining = (deadline: string | null) => {
    if (!deadline) return '無期限';

    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return '終了';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `残り${days}日`;
    if (hours > 0) return `残り${hours}時間`;
    return '間もなく終了';
  };

  const formatVoteCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">順位</th>
            <th className="px-4 py-3 text-left text-sm font-medium">タイトル</th>
            <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">カテゴリー</th>
            <th className="px-4 py-3 text-center text-sm font-medium">投票数</th>
            <th className="px-4 py-3 text-center text-sm font-medium hidden md:table-cell">期限</th>
            <th className="px-4 py-3 text-center text-sm font-medium">詳細</th>
          </tr>
        </thead>
        <tbody>
          {polls.map((poll, index) => {
            const rank = startRank + index;
            const isHighlighted = showTrending && rank <= 10;

            return (
              <tr
                key={poll.id}
                className={cn(
                  "border-b transition-colors hover:bg-muted/30",
                  isHighlighted && "bg-yellow-50/50 dark:bg-yellow-900/10"
                )}
              >
                {/* 順位 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold text-lg",
                      rank <= 10 && "text-primary"
                    )}>
                      {rank}
                    </span>
                    <span className="text-sm text-muted-foreground">位</span>
                    {isHighlighted && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                        <TrendingUp className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </td>

                {/* タイトル */}
                <td className="px-4 py-3">
                  <Link
                    href={`/polls/${poll.id}`}
                    className="group flex flex-col gap-1 hover:text-primary transition-colors"
                  >
                    <span className="font-medium line-clamp-1 group-hover:underline">
                      {poll.title}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {poll.description}
                    </span>
                  </Link>
                </td>

                {/* カテゴリー */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {poll.categories && poll.categories.slice(0, 2).map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {poll.categories && poll.categories.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{poll.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                {/* 投票数 */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {formatVoteCount(poll.totalVotes)}
                    </span>
                    <span className="text-sm text-muted-foreground">票</span>
                  </div>
                </td>

                {/* 期限 */}
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className={cn(
                      "text-muted-foreground",
                      calculateTimeRemaining(poll.deadline) === '終了' && "text-red-500"
                    )}>
                      {calculateTimeRemaining(poll.deadline)}
                    </span>
                  </div>
                </td>

                {/* 詳細リンク */}
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/polls/${poll.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    見る
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}