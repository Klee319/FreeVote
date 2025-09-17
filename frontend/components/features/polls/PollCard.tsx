import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp } from 'lucide-react';
import { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
  showTrending?: boolean;
}

export function PollCard({ poll, showTrending = false }: PollCardProps) {
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
    <Link href={`/polls/${poll.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        {poll.thumbnailUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={poll.thumbnailUrl}
              alt={poll.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
            {showTrending && (
              <Badge variant="destructive" className="shrink-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                急上昇
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2 mt-2">
            {poll.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {poll.categories && Array.isArray(poll.categories) &&
              poll.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            {poll.isAccentMode && (
              <Badge variant="outline">アクセント投票</Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{formatVoteCount(poll.totalVotes)}票</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{calculateTimeRemaining(poll.deadline)}</span>
            </div>
          </div>

          {poll.voteDistribution && (
            <div className="mt-3 space-y-1">
              {poll.options.slice(0, 2).map((option, index) => {
                const percentage = poll.totalVotes
                  ? ((poll.voteDistribution![index] || 0) / poll.totalVotes) * 100
                  : 0;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs truncate flex-1">{option.label}</span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-10 text-right">{percentage.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}