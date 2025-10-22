import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from './use-toast';

export function useCommentDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteComment = async (
    commentId: string,
    userToken?: string
  ): Promise<boolean> => {
    setIsDeleting(true);

    try {
      const response = await api.deleteComment(commentId, userToken);

      if (response.status === 'success') {
        toast({
          title: 'コメントを削除しました',
          description: 'コメントが正常に削除されました。',
        });
        return true;
      } else {
        toast({
          title: 'エラー',
          description: response.error || 'コメントの削除に失敗しました',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      toast({
        title: 'エラー',
        description: 'コメントの削除に失敗しました',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteComment,
    isDeleting,
  };
}