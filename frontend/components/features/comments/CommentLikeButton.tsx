'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useCommentLike } from '@/hooks/useCommentLike';
import { cn } from '@/lib/utils';

interface CommentLikeButtonProps {
  pollId: string;
  commentId: string;
  likeCount: number;
  isLiked: boolean;
}

export function CommentLikeButton({
  pollId,
  commentId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
}: CommentLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const { toggleLike, isToggling } = useCommentLike();

  const handleLike = async () => {
    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    const success = await toggleLike(pollId, commentId);

    if (!success) {
      // Revert on failure
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isToggling}
      className={cn(
        'h-8 px-3 transition-all duration-200',
        isLiked
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
          : 'hover:bg-primary/10 hover:text-primary'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 mr-1.5 transition-transform duration-200',
          isLiked && 'fill-current scale-110'
        )}
      />
      <span className="text-sm font-medium">{likeCount}</span>
    </Button>
  );
}