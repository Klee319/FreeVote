import { SearchWordsQuery, SearchWordsResponse, WordDetail, VoteData, RankingWord, Word, SubmitTermData, SubmitTermResponse } from '@/types';
import { mockWords, mockWordDetails, mockRankingWords } from '@/data/mockData';

// APIクライアント（現在はモックデータを返す）
export const api = {
  // 語検索
  searchWords: async (query: SearchWordsQuery): Promise<SearchWordsResponse> => {
    // モックデータから検索
    await new Promise(resolve => setTimeout(resolve, 300)); // 擬似的な遅延
    
    let filteredWords = [...mockWords];
    
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      filteredWords = filteredWords.filter(word => 
        word.headword.toLowerCase().includes(searchTerm) ||
        word.reading.toLowerCase().includes(searchTerm)
      );
    }
    
    if (query.category) {
      filteredWords = filteredWords.filter(word => word.category === query.category);
    }
    
    // ソート
    if (query.sortBy === 'popularity') {
      filteredWords.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    } else if (query.sortBy === 'alphabetical') {
      filteredWords.sort((a, b) => a.reading.localeCompare(b.reading));
    }
    
    // ページネーション
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWords = filteredWords.slice(startIndex, endIndex);
    
    return {
      words: paginatedWords,
      totalCount: filteredWords.length,
      currentPage: page,
      totalPages: Math.ceil(filteredWords.length / limit),
    };
  },
  
  // 語詳細取得
  getWordDetail: async (id: string): Promise<WordDetail> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const detail = mockWordDetails[id];
    if (!detail) {
      throw new Error('Word not found');
    }
    
    return detail;
  },
  
  // 投票
  submitVote: async (voteData: VoteData): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // デバイスIDをlocalStorageに保存（実際の実装では適切な処理が必要）
    if (typeof window !== 'undefined' && voteData.deviceId) {
      localStorage.setItem('deviceId', voteData.deviceId);
      
      // 投票履歴を保存
      let voteHistory: any = {};
      try {
        const stored = localStorage.getItem('voteHistory');
        voteHistory = stored ? JSON.parse(stored) : {};
      } catch (e) {
        console.warn('Failed to parse voteHistory from localStorage', e);
        voteHistory = {};
      }
      voteHistory[voteData.wordId] = {
        accentTypeId: voteData.accentTypeId,
        votedAt: new Date().toISOString(),
      };
      localStorage.setItem('voteHistory', JSON.stringify(voteHistory));
    }
    
    return {
      success: true,
      message: '投票が完了しました',
    };
  },
  
  // ランキング取得
  getRanking: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<RankingWord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockRankingWords;
  },
  
  // 新着語取得
  getRecentWords: async (limit: number = 10): Promise<Word[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 作成日でソートして返す
    const sorted = [...mockWords].sort((a, b) => {
      const dateA = new Date(a.createdAt || '2024-01-01').getTime();
      const dateB = new Date(b.createdAt || '2024-01-01').getTime();
      return dateB - dateA;
    });
    
    return sorted.slice(0, limit);
  },
  
  // 投票可能かチェック
  canVote: async (wordId: number): Promise<{ canVote: boolean; reason?: string }> => {
    if (typeof window === 'undefined') {
      return { canVote: true };
    }
    
    let voteHistory: any = {};
    try {
      const stored = localStorage.getItem('voteHistory');
      voteHistory = stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Failed to parse voteHistory from localStorage', e);
      voteHistory = {};
    }
    const lastVote = voteHistory[wordId];
    
    if (lastVote) {
      const lastVoteTime = new Date(lastVote.votedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceVote = (now - lastVoteTime) / (1000 * 60 * 60);
      
      if (hoursSinceVote < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceVote);
        return {
          canVote: false,
          reason: `この語には既に投票済みです。${hoursRemaining}時間後に再度投票できます。`,
        };
      }
    }
    
    return { canVote: true };
  },
  
  // サジェスト取得
  getWordSuggestions: async (query: string): Promise<Word[]> => {
    if (!query || query.length < 1) return [];
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const searchTerm = query.toLowerCase();
    const suggestions = mockWords.filter(word => 
      word.headword.toLowerCase().startsWith(searchTerm) ||
      word.reading.toLowerCase().startsWith(searchTerm)
    );
    
    return suggestions.slice(0, 5);
  },
  
  // 新語投稿
  submitTerm: async (data: SubmitTermData): Promise<SubmitTermResponse> => {
    // バリデーション
    if (!data.term || data.term.trim().length === 0) {
      return {
        success: false,
        message: '用語名を入力してください',
        error: 'TERM_REQUIRED',
      };
    }
    
    if (!data.reading || data.reading.trim().length === 0) {
      return {
        success: false,
        message: '読みを入力してください',
        error: 'READING_REQUIRED',
      };
    }
    
    if (!data.description || data.description.trim().length === 0) {
      return {
        success: false,
        message: '説明文を入力してください',
        error: 'DESCRIPTION_REQUIRED',
      };
    }
    
    if (!data.category) {
      return {
        success: false,
        message: 'カテゴリーを選択してください',
        error: 'CATEGORY_REQUIRED',
      };
    }
    
    // 擬似的な遅延
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 重複チェック（モック）
    const existingWord = mockWords.find(word => 
      word.headword.toLowerCase() === data.term.toLowerCase() ||
      word.reading.toLowerCase() === data.reading.toLowerCase()
    );
    
    if (existingWord) {
      return {
        success: false,
        message: 'この用語は既に登録されています',
        error: 'DUPLICATE_TERM',
      };
    }
    
    // 成功レスポンス（モック）
    const newWordId = Math.floor(Math.random() * 10000) + 1000;
    
    return {
      success: true,
      message: '新語の投稿が完了しました！投稿内容は管理者による確認後に公開されます。',
      wordId: newWordId,
    };
  },
};