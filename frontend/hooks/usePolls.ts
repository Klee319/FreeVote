import { useState, useEffect, useCallback } from 'react';
import { usePollStore } from '@/stores/pollStore';
import api from '@/lib/api';
import { Poll, Vote, PollStatistics } from '@/types';

export function usePolls() {
  const {
    polls,
    pagination,
    currentPoll,
    currentStatistics,
    recentVotes,
    isLoading,
    error,
    setPolls,
    setPagination,
    setCurrentPoll,
    setCurrentStatistics,
    addRecentVote,
    hasVoted,
    setLoading,
    setError,
  } = usePollStore();

  // Fetch polls list
  const fetchPolls = useCallback(async (params?: {
    category?: string;
    sort?: string;
    search?: string
  }) => {
    setLoading(true);
    setError(null);

    const response = await api.getPolls(params);

    if (response.status === 'success' && response.data) {
      // APIレスポンスからpollsとpaginationを分離して設定
      if (response.data.polls && Array.isArray(response.data.polls)) {
        setPolls(response.data.polls);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (Array.isArray(response.data)) {
        // 配列が直接返される場合（後方互換性のため）
        setPolls(response.data);
      } else {
        setError('予期しないデータ形式です');
      }
    } else {
      setError(response.error || '投票の取得に失敗しました');
    }

    setLoading(false);
  }, [setPolls, setPagination, setLoading, setError]);

  // Fetch single poll
  const fetchPoll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const response = await api.getPoll(id);

    if (response.status === 'success' && response.data) {
      // APIレスポンスからpollオブジェクトを正しく抽出
      if (response.data.poll) {
        // 新しいレスポンス形式：{ poll: {...}, results: {...} }
        // resultsの情報をpollオブジェクトにマージ
        const mergedPoll = {
          ...response.data.poll,
          totalVotes: response.data.results?.totalVotes || 0,
          voteDistribution: response.data.results?.options?.reduce(
            (acc: Record<number, number>, opt: any) => {
              acc[opt.option] = opt.count;
              return acc;
            },
            {}
          ) || {},
        };
        setCurrentPoll(mergedPoll);
        // 投票結果を含めた完全なデータを返す
        if (response.data.results) {
          return { poll: mergedPoll, results: response.data.results };
        }
        return mergedPoll;
      } else {
        // 後方互換性：直接pollオブジェクトが返される場合
        setCurrentPoll(response.data);
        return response.data;
      }
    } else {
      setError(response.error || '投票の取得に失敗しました');
      return null;
    }
  }, [setCurrentPoll, setLoading, setError]);

  // Submit vote
  const submitVote = useCallback(async (
    pollId: string,
    voteData: Omit<Vote, 'pollId'>
  ) => {
    setLoading(true);
    setError(null);

    // Check if already voted
    if (hasVoted(pollId)) {
      setError('この投票には既に参加済みです');
      setLoading(false);
      return { success: false, error: 'Already voted' };
    }

    const response = await api.votePoll(pollId, voteData);

    if (response.status === 'success') {
      // Mark as voted
      addRecentVote(pollId, voteData.option);

      // Store user token if returned
      if (response.data?.userToken) {
        localStorage.setItem(`vote-token-${pollId}`, response.data.userToken);
      }

      // Refresh poll data to get updated counts
      await fetchPoll(pollId);

      setLoading(false);
      return { success: true, data: response.data };
    } else {
      setError(response.error || '投票の送信に失敗しました');
      setLoading(false);
      return { success: false, error: response.error };
    }
  }, [hasVoted, addRecentVote, fetchPoll, setLoading, setError]);

  // Fetch poll statistics
  const fetchPollStatistics = useCallback(async (
    pollId: string,
    filterBy?: 'age' | 'gender' | 'prefecture'
  ) => {
    setLoading(true);
    setError(null);

    const response = await api.getPollStats(pollId, filterBy);

    if (response.status === 'success' && response.data) {
      setCurrentStatistics(response.data);
      return response.data;
    } else {
      setError(response.error || '統計の取得に失敗しました');
      return null;
    }
  }, [setCurrentStatistics, setLoading, setError]);

  // Fetch poll data by prefecture
  const fetchPollByPrefecture = useCallback(async (pollId: string) => {
    const response = await api.getPollByPrefecture(pollId);

    if (response.status === 'success' && response.data) {
      return response.data;
    }
    return null;
  }, []);

  // Get share message
  const getShareMessage = useCallback(async (
    pollId: string,
    selectedOption: number
  ) => {
    const response = await api.getShareMessage(pollId, selectedOption);

    if (response.status === 'success' && response.data) {
      return response.data;
    }
    return null;
  }, []);

  // Track referral visit
  const trackReferral = useCallback(async (
    sharedBy: string,
    pollId: string
  ) => {
    // Get or create visitor token
    let visitorToken = localStorage.getItem('visitor-token');
    if (!visitorToken) {
      visitorToken = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor-token', visitorToken);
    }

    await api.trackReferral({
      sharedBy,
      pollId,
      visitorToken,
    });
  }, []);

  // Check if user has voted on a poll
  const checkVoteStatus = useCallback((pollId: string) => {
    // Check in-memory store first
    if (hasVoted(pollId)) {
      return true;
    }

    // Check localStorage for vote token
    const voteToken = localStorage.getItem(`vote-token-${pollId}`);
    return !!voteToken;
  }, [hasVoted]);

  return {
    // State
    polls,
    pagination,
    currentPoll,
    currentStatistics,
    recentVotes,
    isLoading,
    error,

    // Actions
    fetchPolls,
    fetchPoll,
    submitVote,
    fetchPollStatistics,
    fetchPollByPrefecture,
    getShareMessage,
    trackReferral,
    checkVoteStatus,
  };
}