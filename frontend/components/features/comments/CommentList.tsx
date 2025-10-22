'use client';

import { CommentItem } from './CommentItem';
import { Skeleton } from '@/components/ui/skeleton';
import type { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
  pollId: string;
  isLoading: boolean;
  onCommentUpdate: () => void;
}

export function CommentList({
  comments,
  pollId,
  isLoading,
  onCommentUpdate,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          まだコメントはありません。最初のコメントを投稿してみませんか?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          pollId={pollId}
          onCommentUpdate={onCommentUpdate}
          isLast={index === comments.length - 1}
        />
      ))}
    </div>
  );
}