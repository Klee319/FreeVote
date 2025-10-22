import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { StatsAccessInfo } from '@/types';

export function useStatsAccess(pollId: string) {
  const [access, setAccess] = useState<StatsAccessInfo>({
    hasAccess: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check access status
  const checkAccess = useCallback(async () => {
    if (!pollId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.checkStatsAccess(pollId);

      if (response.status === 'success' && response.data) {
        setAccess(response.data);
      } else {
        setError(response.error || 'アクセス情報の取得に失敗しました');
        setAccess({ hasAccess: false });
      }
    } catch (err) {
      console.error('Failed to check stats access:', err);
      setError('アクセス情報の取得に失敗しました');
      setAccess({ hasAccess: false });
    } finally {
      setIsLoading(false);
    }
  }, [pollId]);

  // Grant access after sharing
  const grantAccess = useCallback(async (platform: string) => {
    if (!pollId) return { success: false, error: '投票IDが不正です' };

    // Get userToken from localStorage
    const userToken = localStorage.getItem(`vote-token-${pollId}`);
    if (!userToken) {
      setError('ユーザートークンが見つかりません。先に投票してください。');
      return { success: false, error: 'ユーザートークンが見つかりません' };
    }

    try {
      const response = await api.grantStatsAccess(pollId, userToken);

      if (response.status === 'success' && response.data) {
        setAccess(response.data);
        return { success: true };
      } else {
        setError(response.error || 'アクセス許可に失敗しました');
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Failed to grant stats access:', err);
      setError('アクセス許可に失敗しました');
      return { success: false, error: 'アクセス許可に失敗しました' };
    }
  }, [pollId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess: access.hasAccess,
    expiresAt: access.expiresAt,
    grantedAt: access.grantedAt,
    platform: access.platform,
    isLoading,
    error,
    checkAccess,
    grantAccess,
  };
}
