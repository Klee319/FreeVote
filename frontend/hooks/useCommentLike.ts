import { useState } from 'react';
import { apiCall } from '@/lib/api';

export function useCommentLike() {
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = async (pollId: string, commentId: string): Promise<boolean> => {
    setIsToggling(true);

    try {
      const response = await apiCall('POST', `/polls/${pollId}/comments/${commentId}/like`, {});
      return response.status === 'success';
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