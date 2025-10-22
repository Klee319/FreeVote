import { useState } from 'react';
import { apiCall } from '@/lib/api';
import { useToast } from './use-toast';

export function useCommentDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteComment = async (pollId: string, commentId: string): Promise<void> => {
    setIsDeleting(true);

    try {
      const response = await apiCall('DELETE', `/polls/${pollId}/comments/${commentId}`);
      if (response.status === 'success') {
        toast({
          title: 'コメントを削除しました',
          description: 'コメントが正常に削除されました。',
        });
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      toast({
        title: 'エラー',
        description: 'コメントの削除に失敗しました',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteComment,
    isDeleting,
  };
}