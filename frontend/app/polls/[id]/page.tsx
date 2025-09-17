'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VoteForm } from '@/components/features/polls/VoteForm';
import { PollResults } from '@/components/features/polls/PollResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePolls } from '@/hooks/usePolls';
import { useAuthStore } from '@/stores/authStore';
import { Clock, Users, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/features/share/ShareDialog';

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const { currentPoll, isLoading, fetchPoll, checkVoteStatus } = usePolls();
  const { isAuthenticated, user } = useAuthStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (pollId) {
      fetchPoll(pollId);
      setHasVoted(checkVoteStatus(pollId));
    }

    // Check for referral tracking
    const urlParams = new URLSearchParams(window.location.search);
    const sharedBy = urlParams.get('sharedBy');
    if (sharedBy) {
      // Track referral visit
      // This would be handled by usePolls hook
    }
  }, [pollId, fetchPoll, checkVoteStatus]);

  useEffect(() => {
    if (hasVoted) {
      setShowResults(true);
    }
  }, [hasVoted]);

  const calculateTimeRemaining = (deadline: string | null) => {
    if (!deadline) return { text: '無期限', isEnded: false };

    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { text: '終了', isEnded: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return { text: `残り${days}日${hours}時間`, isEnded: false };
    if (hours > 0) return { text: `残り${hours}時間${minutes}分`, isEnded: false };
    return { text: `残り${minutes}分`, isEnded: false };
  };

  const handleVoteComplete = async (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setHasVoted(true);
    setShowResults(true);

    // 投票後に最新の投票データを再取得
    await fetchPoll(params.id);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPoll) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">投票が見つかりませんでした</p>
            <Button onClick={() => router.push('/')}>
              トップページに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeInfo = calculateTimeRemaining(currentPoll.deadline);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Poll Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{currentPoll.title}</CardTitle>
              <CardDescription className="text-base">
                {currentPoll.description}
              </CardDescription>
            </div>
            {currentPoll.thumbnailUrl && (
              <img
                src={currentPoll.thumbnailUrl}
                alt={currentPoll.title}
                className="w-32 h-32 object-cover rounded ml-4"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {currentPoll.categories && Array.isArray(currentPoll.categories) &&
              currentPoll.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            {currentPoll.isAccentMode && (
              <Badge variant="outline">アクセント投票</Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{currentPoll.totalVotes || 0}人が投票</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className={timeInfo.isEnded ? 'text-red-500' : ''}>
                {timeInfo.text}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="ml-auto"
            >
              <Share2 className="h-4 w-4 mr-2" />
              シェア
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      {!hasVoted && !timeInfo.isEnded ? (
        <VoteForm
          poll={currentPoll}
          onVoteComplete={handleVoteComplete}
        />
      ) : (
        <PollResults
          poll={currentPoll}
          selectedOption={selectedOption}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <ShareDialog
          poll={currentPoll}
          selectedOption={selectedOption}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}