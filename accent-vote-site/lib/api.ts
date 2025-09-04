import { SearchWordsQuery, SearchWordsResponse, WordDetail, VoteData, RankingWord, Word, SubmitTermData, SubmitTermResponse } from '@/types';
import { mockWords, mockWordDetails, mockRankingWords } from '@/data/mockData';

// APIエンドポイントのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// デバッグモード
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// APIクライアント
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
  submitVote: async (voteData: VoteData): Promise<{ success: boolean; message: string; stats?: any }> => {
    if (DEBUG_MODE) {
      console.log('[API] Submitting vote:', voteData);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
        credentials: 'include', // Cookie送信を確実に行う
      });
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Vote response:', result);
      }
      
      if (!response.ok) {
        throw new Error(result.message || '投票に失敗しました');
      }
      
      return {
        success: result.success,
        message: result.message || '投票が完了しました',
        stats: result.statistics || result.stats, // 統計データを含める
      };
    } catch (error) {
      console.error('[API] Vote error:', error);
      // モックにフォールバック（開発環境用）
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for vote');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // モック用の統計データを生成
        const mockStats = {
          national: [
            { accentType: 'heiban', voteCount: 678 + Math.floor(Math.random() * 10), percentage: 55 },
            { accentType: 'atamadaka', voteCount: 345 + Math.floor(Math.random() * 10), percentage: 28 },
            { accentType: 'nakadaka', voteCount: 123 + Math.floor(Math.random() * 10), percentage: 10 },
            { accentType: 'odaka', voteCount: 88 + Math.floor(Math.random() * 10), percentage: 7 },
          ]
        };
        
        return {
          success: true,
          message: '投票が完了しました（モック）',
          stats: mockStats,
        };
      }
      throw error;
    }
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
    if (DEBUG_MODE) {
      console.log('[API] Checking if can vote for word:', wordId);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/votes/can-vote/${wordId}`, {
        method: 'GET',
        credentials: 'include', // Cookie送信を確実に行う
      });
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Can vote response:', result);
      }
      
      if (!response.ok) {
        throw new Error(result.message || '投票可能状態の確認に失敗しました');
      }
      
      return {
        canVote: result.canVote,
        reason: result.reason,
      };
    } catch (error) {
      console.error('[API] Can vote check error:', error);
      // モックにフォールバック（開発環境用）
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for can vote check');
        return { canVote: true };
      }
      // エラー時はデフォルトで投票可能にする
      return { canVote: true };
    }
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
  
  // ジェネリックGETメソッド
  get: async <T = any>(url: string): Promise<T> => {
    if (DEBUG_MODE) {
      console.log('[API] GET request to:', url);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] GET response:', result);
      }
      
      return result;
    } catch (error) {
      console.error('[API] GET error:', error);
      throw error;
    }
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
    
    if (DEBUG_MODE) {
      console.log('[API] Submitting new term:', data);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Cookie送信を確実に行う
      });
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Submit term response:', result);
      }
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || '投稿に失敗しました',
          error: result.error || 'SUBMISSION_FAILED',
        };
      }
      
      return {
        success: true,
        message: result.message || '新語の投稿が完了しました！投稿内容は管理者による確認後に公開されます。',
        wordId: result.wordId,
      };
    } catch (error) {
      console.error('[API] Submit term error:', error);
      // モックにフォールバック（開発環境用）
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for term submission');
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
        
        const newWordId = Math.floor(Math.random() * 10000) + 1000;
        return {
          success: true,
          message: '新語の投稿が完了しました！（モック）',
          wordId: newWordId,
        };
      }
      throw error;
    }
  },
};