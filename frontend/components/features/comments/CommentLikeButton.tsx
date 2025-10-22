'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useCommentLike } from '@/hooks/useCommentLike';
import { cn } from '@/lib/utils';

interface CommentLikeButtonProps {
  commentId: string;
  likeCount: number;
  isLiked: boolean;
  userToken?: string;
}

export function CommentLikeButton({
  commentId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
  userToken,
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

    const success = await toggleLike({
      commentId,
      userToken,
    });

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
        'h-7 text-xs transition-all',
        isLiked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart
        className={cn(
          'h-3 w-3 mr-1 transition-all',
          isLiked && 'fill-current animate-pulse'
        )}
      />
      {likeCount > 0 && <span>{likeCount}</span>}
    </Button>
  );
}