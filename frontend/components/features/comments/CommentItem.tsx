'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentReplyForm } from './CommentReplyForm';
import { CommentLikeButton } from './CommentLikeButton';
import { useCommentDelete } from '@/hooks/useCommentDelete';
import { useAuthStore } from '@/stores/authStore';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CommentItemProps {
  comment: Comment;
  pollId: string;
  userToken?: string;
  onCommentUpdate: () => void;
  depth?: number;
}

export function CommentItem({
  comment,
  pollId,
  userToken,
  onCommentUpdate,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const { user } = useAuthStore();
  const { deleteComment, isDeleting } = useCommentDelete();

  const handleDelete = async () => {
    if (window.confirm('コメントを削除しますか?')) {
      await deleteComment(comment.id);
      onCommentUpdate();
    }
  };

  const handleReplySubmit = () => {
    setShowReplyForm(false);
    onCommentUpdate();
  };

  const getUserDisplayName = () => {
    if (comment.username) {
      return comment.username;
    }
    return 'ゲストユーザー';
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

  const canDelete = () => {
    if (user?.id && comment.userId === user.id) {
      return true;
    }
    if (userToken && comment.userToken === userToken) {
      return true;
    }
    return false;
  };

  // Show max 2 levels of nesting
  const maxDepth = 2;
  const isMaxDepth = depth >= maxDepth;

  // Show first 3 replies, hide rest behind "もっと見る"
  const visibleReplies = showAllReplies
    ? (comment.replies || [])
    : (comment.replies?.slice(0, 3) || []);
  const hasMoreReplies =
    (comment.replies?.length || 0) > 3 && !showAllReplies;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getUserDisplayName().charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{getUserDisplayName()}</span>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo()}
            </span>
          </div>

          <p className="text-sm mb-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-2">
            <CommentLikeButton
              commentId={comment.id}
              likeCount={comment.likeCount}
              isLiked={comment.isLikedByUser || false}
              userToken={userToken}
            />

            {!isMaxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-7 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                返信
              </Button>
            )}

            {canDelete() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                削除
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentReplyForm
                pollId={pollId}
                parentId={comment.id}
                userToken={userToken}
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {!isMaxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-7 text-xs mb-2"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      返信を隠す ({comment.replies.length})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      返信を表示 ({comment.replies.length})
                    </>
                  )}
                </Button>
              )}

              {showReplies && (
                <div className="space-y-4">
                  {visibleReplies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      pollId={pollId}
                      userToken={userToken}
                      onCommentUpdate={onCommentUpdate}
                      depth={depth + 1}
                    />
                  ))}

                  {hasMoreReplies && comment.replies && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAllReplies(true)}
                      className="h-auto p-0 text-xs"
                    >
                      さらに{comment.replies.length - 3}件の返信を表示
                    </Button>
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