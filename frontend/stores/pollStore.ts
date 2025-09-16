import { create } from 'zustand';
import { Poll, Vote, PollStatistics } from '@/types';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  currentStatistics: PollStatistics | null;
  recentVotes: Map<string, number>; // pollId -> optionIndex
  isLoading: boolean;
  error: string | null;

  // Actions
  setPolls: (polls: Poll[]) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  setCurrentStatistics: (stats: PollStatistics | null) => void;
  addRecentVote: (pollId: string, optionIndex: number) => void;
  hasVoted: (pollId: string) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  currentPoll: null,
  currentStatistics: null,
  recentVotes: new Map(),
  isLoading: false,
  error: null,

  setPolls: (polls) => set({ polls, error: null }),

  setCurrentPoll: (poll) => set({ currentPoll: poll, error: null }),

  setCurrentStatistics: (stats) => set({ currentStatistics: stats }),

  addRecentVote: (pollId, optionIndex) => {
    const newVotes = new Map(get().recentVotes);
    newVotes.set(pollId, optionIndex);
    set({ recentVotes: newVotes });
  },

  hasVoted: (pollId) => {
    return get().recentVotes.has(pollId);
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set({
    polls: [],
    currentPoll: null,
    currentStatistics: null,
    isLoading: false,
    error: null,
  }),
}));