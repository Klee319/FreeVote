'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentForm } from './CommentForm';
import { CommentLikeButton } from './CommentLikeButton';
import { CommentDeleteButton } from './CommentDeleteButton';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  pollId: string;
  onCommentUpdate: () => void;
  depth?: number;
  isLast?: boolean;
}

export function CommentItem({
  comment,
  pollId,
  onCommentUpdate,
  depth = 0,
  isLast = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onCommentUpdate();
  };

  const getUserDisplayName = () => {
    return comment.user?.username || 'ゲストユーザー';
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return '';
    }
  };

  // Show max 3 levels of nesting
  const maxDepth = 3;
  const isMaxDepth = depth >= maxDepth;

  // Show first 3 replies, hide rest behind "もっと見る"
  const visibleReplies = showAllReplies
    ? (comment.replies || [])
    : (comment.replies?.slice(0, 3) || []);
  const hasMoreReplies =
    (comment.replies?.length || 0) > 3 && !showAllReplies;

  return (
    <div className="relative">
      {/* スレッド線 */}
      {depth > 0 && (
        <div
          className={cn(
            'absolute left-0 top-0 w-0.5 bg-gradient-to-b from-border to-transparent',
            isLast ? 'h-12' : 'h-full'
          )}
        />
      )}

      <div
        className={cn(
          'flex gap-3 group relative transition-colors duration-200',
          depth > 0 && 'ml-12',
          'hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg'
        )}
      >
        {/* アバター */}
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background transition-all duration-200 group-hover:ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm hover:underline cursor-pointer">
              {getUserDisplayName()}
            </span>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo()}
            </span>
            {comment.parent && (
              <span className="text-xs text-primary">
                返信先: @{comment.parent.user?.username || 'ゲストユーザー'}
              </span>
            )}
          </div>

          {/* コメント本文 */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* アクションボタン */}
          <div className="flex items-center gap-1 -ml-2">
            <CommentLikeButton
              pollId={pollId}
              commentId={comment.id}
              likeCount={comment.likeCount}
              isLiked={comment.isLiked}
            />

            {!isMaxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className={cn(
                  'h-8 px-3 hover:bg-primary/10 hover:text-primary transition-colors',
                  showReplyForm && 'bg-primary/10 text-primary'
                )}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span className="text-sm">返信</span>
              </Button>
            )}

            <CommentDeleteButton
              pollId={pollId}
              commentId={comment.id}
              userId={comment.user?.id || null}
              onSuccess={onCommentUpdate}
            />
          </div>

          {/* 返信フォーム */}
          {showReplyForm && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <CommentForm
                pollId={pollId}
                parentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`@${getUserDisplayName()} に返信...`}
                showCancelButton={true}
              />
            </div>
          )}

          {/* 返信 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {!isMaxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-8 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                      返信を隠す ({comment.replies.length})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                      返信を表示 ({comment.replies.length})
                    </>
                  )}
                </Button>
              )}

              {showReplies && (
                <div className="space-y-3">
                  {visibleReplies.map((reply, index) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      pollId={pollId}
                      onCommentUpdate={onCommentUpdate}
                      depth={depth + 1}
                      isLast={index === visibleReplies.length - 1 && !hasMoreReplies}
                    />
                  ))}

                  {hasMoreReplies && comment.replies && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAllReplies(true)}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      さらに{comment.replies.length - 3}件の返信を表示
                    </Button>
                  )}

                  {isMaxDepth && hasMoreReplies && (
                    <div className="text-xs text-muted-foreground italic pl-4 border-l-2 border-dashed border-muted">
                      これ以上の階層は表示されません
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}