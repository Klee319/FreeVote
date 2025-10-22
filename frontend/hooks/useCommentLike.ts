import { useState } from 'react';
import api from '@/lib/api';
import { CommentLikeData } from '@/types';

export function useCommentLike() {
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = async (data: CommentLikeData): Promise<boolean> => {
    setIsToggling(true);

    try {
      const response = await api.toggleCommentLike(data.commentId, data.userToken);

      if (response.status === 'success') {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    } finally {
      setIsToggling(false);
    }
  };

  return {
    toggleLike,
    isToggling,
  };
}