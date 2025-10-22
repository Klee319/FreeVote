import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Comment } from '@/types';

export function useComments(pollId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (page: number = 1, limit: number = 10) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getComments(pollId, page, limit);

        if (response.status === 'success' && response.data) {
          setComments(response.data.comments || []);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setError(response.error || 'コメントの取得に失敗しました');
        }
      } catch (err) {
        setError('コメントの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [pollId]
  );

  return {
    comments,
    totalPages,
    isLoading,
    error,
    fetchComments,
  };
}