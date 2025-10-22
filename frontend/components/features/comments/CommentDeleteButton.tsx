'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useCommentDelete } from '@/hooks/useCommentDelete';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CommentDeleteButtonProps {
  pollId: string;
  commentId: string;
  userId: string | null;
  onSuccess?: () => void;
}

export function CommentDeleteButton({
  pollId,
  commentId,
  userId,
  onSuccess,
}: CommentDeleteButtonProps) {
  const { user } = useAuthStore();
  const { deleteComment, isDeleting } = useCommentDelete();
  const [showDialog, setShowDialog] = useState(false);

  // 自分のコメントでなければ表示しない
  if (!user || user.id !== userId) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteComment(pollId, commentId);
      onSuccess?.();
      setShowDialog(false);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コメントを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このコメントを削除してもよろしいですか?この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
