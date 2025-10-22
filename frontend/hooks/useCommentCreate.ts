import { useState } from 'react';
import api from '@/lib/api';
import { CreateCommentData } from '@/types';
import { useToast } from './use-toast';

export function useCommentCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createComment = async (data: CreateCommentData): Promise<boolean> => {
    setIsCreating(true);

    try {
      const { pollId, ...commentData } = data;
      const response = await api.createComment(pollId, commentData);

      if (response.status === 'success') {
        toast({
          title: 'コメントを投稿しました',
          description: 'コメントが正常に投稿されました。',
        });
        return true;
      } else {
        toast({
          title: 'エラー',
          description: response.error || 'コメントの投稿に失敗しました',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      toast({
        title: 'エラー',
        description: 'コメントの投稿に失敗しました',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createComment,
    isCreating,
  };
}