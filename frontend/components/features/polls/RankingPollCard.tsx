import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingUp, Crown, Award, Medal, Image as ImageIcon } from 'lucide-react';
import { Poll } from '@/types';
import { cn } from '@/lib/utils';

interface RankingPollCardProps {
  poll: Poll;
  rank: number;
  showTrending?: boolean;
}

export function RankingPollCard({ poll, rank, showTrending = false }: RankingPollCardProps) {
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

  // ランキングに応じたスタイルを決定
  const getRankStyles = () => {
    switch (rank) {
      case 1:
        return {
          borderColor: 'border-yellow-500',
          bgGradient: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
          rankIcon: <Crown className="w-8 h-8 text-yellow-500" />,
          rankBadge: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          glowEffect: 'shadow-lg shadow-yellow-500/20',
        };
      case 2:
        return {
          borderColor: 'border-gray-400',
          bgGradient: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
          rankIcon: <Award className="w-7 h-7 text-gray-500" />,
          rankBadge: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
          glowEffect: 'shadow-md shadow-gray-400/20',
        };
      case 3:
        return {
          borderColor: 'border-orange-400',
          bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
          rankIcon: <Medal className="w-6 h-6 text-orange-500" />,
          rankBadge: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
          glowEffect: 'shadow-md shadow-orange-400/20',
        };
      default:
        return {
          borderColor: 'border-border',
          bgGradient: '',
          rankIcon: null,
          rankBadge: 'bg-primary/10 text-primary',
          glowEffect: '',
        };
    }
  };

  const styles = getRankStyles();
  const isTopThree = rank <= 3;

  return (
    <Link href={`/polls/${poll.id}`}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1',
          styles.borderColor,
          styles.bgGradient,
          styles.glowEffect,
          isTopThree && 'border-2',
        )}
      >
        {/* ランキング表示 */}
        <div className="absolute top-0 left-0 z-10">
          <div
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-br-xl',
              styles.rankBadge,
              isTopThree && 'shadow-md'
            )}
          >
            {styles.rankIcon}
            <span className="font-bold text-lg">
              {rank}
            </span>
            <span className="text-sm font-medium">位</span>
          </div>
        </div>

        {/* トレンドバッジ */}
        {showTrending && rank <= 5 && (
          <div className="absolute top-0 right-4 z-10">
            <Badge
              variant="destructive"
              className="rounded-b-lg rounded-t-none px-3 py-1.5 shadow-md animate-pulse"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              急上昇
            </Badge>
          </div>
        )}

        {/* サムネイル - 1-6位のみ表示 */}
        {rank <= 6 && (
          <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {poll.thumbnailUrl ? (
              <img
                src={poll.thumbnailUrl}
                alt={poll.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
              </div>
            )}
          </div>
        )}

        <CardContent className="p-5">
          {/* タイトルと説明 */}
          <div className={cn("mb-4", rank > 6 ? "mt-8" : !poll.thumbnailUrl && "mt-2")}>
            <h3 className="text-lg font-bold line-clamp-2 mb-2">
              {poll.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {poll.description}
            </p>
          </div>

          {/* カテゴリー */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {poll.categories && Array.isArray(poll.categories) &&
              poll.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            {poll.isAccentMode && (
              <Badge variant="outline" className="text-xs">
                アクセント投票
              </Badge>
            )}
          </div>

          {/* 統計情報 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Users className={cn(
                  "w-4 h-4",
                  isTopThree ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-semibold",
                  isTopThree && "text-primary"
                )}>
                  {formatVoteCount(poll.totalVotes)}
                </span>
                <span className="text-muted-foreground">票</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {calculateTimeRemaining(poll.deadline)}
              </span>
            </div>
          </div>

          {/* 投票分布のプレビュー（上位3位のみ） */}
          {isTopThree && poll.voteDistribution && (poll.totalVotes ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="space-y-1.5">
                {poll.options.slice(0, 2).map((option, index) => {
                  const voteCount = poll.voteDistribution![index] || 0;
                  const percentage = poll.totalVotes
                    ? Math.round((voteCount / poll.totalVotes) * 100)
                    : 0;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs truncate flex-1 text-muted-foreground">
                        {option.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              rank === 1 && "bg-gradient-to-r from-yellow-500 to-orange-500",
                              rank === 2 && "bg-gradient-to-r from-gray-400 to-slate-500",
                              rank === 3 && "bg-gradient-to-r from-orange-400 to-amber-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium min-w-[2.5rem] text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}