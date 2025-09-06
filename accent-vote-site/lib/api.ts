import { SearchWordsQuery, SearchWordsResponse, WordDetail, VoteData, RankingWord, Word, SubmitTermData, SubmitTermResponse } from '@/types';
import { AppSettings, DEFAULT_APP_SETTINGS } from '@/types/settings';
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/words/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Word not found');
        }
        throw new Error(`Failed to fetch word detail: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Word detail response:', {
          wordId: id,
          hasData: !!result.data,
          hasNationalStats: !!result.data?.nationalStats,
          totalVotes: result.data?.word?.totalVotes
        });
      }
      
      // レスポンスデータを正規化して返す
      if (result.data) {
        const wordData = result.data.word || {};
        const nationalStats = result.data.nationalStats || [];
        
        // moraSegmentsがJSON文字列の場合はパース
        let moraSegments = wordData.moraSegments || [];
        if (typeof moraSegments === 'string') {
          try {
            moraSegments = JSON.parse(moraSegments);
          } catch (e) {
            console.warn('[API] Failed to parse moraSegments:', e);
            moraSegments = [];
          }
        }
        
        return {
          id: parseInt(id),
          headword: wordData.headword || '',
          reading: wordData.reading || '',
          category: wordData.category || 'general',
          moraCount: wordData.moraCount || 0,
          moraSegments: Array.isArray(moraSegments) ? moraSegments : [],
          accentOptions: result.data.accentOptions || [],
          nationalStats: nationalStats.map((stat: any) => ({
            accentType: stat.accentType,
            count: stat.voteCount || 0,
            percentage: parseFloat(stat.percentage) || stat.votePercentage || 0
          })),
          prefectureStats: result.data.prefectureStats || [],
          totalVotes: wordData.totalVotes || 0,
          prefectureCount: wordData.prefectureCount || 0,
          createdAt: wordData.createdAt,
          userVote: result.data.userVote,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      // 開発環境でバックエンドに接続できない場合はモックデータにフォールバック
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for word detail');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const detail = mockWordDetails[id];
        if (!detail) {
          throw new Error('Word not found');
        }
        
        return detail;
      }
      throw error;
    }
  },
  
  // 投票
  submitVote: async (voteData: VoteData): Promise<{ success: boolean; message: string; stats?: any }> => {
    if (DEBUG_MODE) {
      console.log('[API] Submitting vote:', {
        wordId: voteData.wordId,
        accentTypeId: voteData.accentTypeId,
        prefecture: voteData.prefecture,
        deviceId: voteData.deviceId ? 'provided' : 'not provided'
      });
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // DeviceIDをヘッダーにも含める
          ...(voteData.deviceId && { 'X-Device-ID': voteData.deviceId }),
        },
        body: JSON.stringify(voteData),
        credentials: 'include', // Cookie送信を確実に行う
      });
      
      // レスポンスのテキストを先に取得
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[API] Failed to parse response:', responseText);
        result = { success: false, message: 'サーバーからの応答が不正です' };
      }
      
      if (DEBUG_MODE) {
        console.log('[API] Vote response:', {
          status: response.status,
          success: result.success,
          hasStats: !!result.stats || !!result.statistics,
          message: result.message
        });
      }
      
      // HTTPステータスコード別のエラーハンドリング
      if (!response.ok) {
        // ステータスコードに応じたエラーメッセージ
        let errorMessage = result.message || '投票に失敗しました';
        
        switch (response.status) {
          case 400:
            // バリデーションエラー
            errorMessage = result.message || '入力データが無効です。もう一度お試しください。';
            break;
          case 403:
            // 権限エラー
            errorMessage = result.message || 'この操作を実行する権限がありません。';
            break;
          case 404:
            // 語が見つからない
            errorMessage = result.message || '指定された語が見つかりません。';
            break;
          case 409:
            // 重複投票
            errorMessage = 'この語には既に投票済みです。他の語への投票をお願いします。';
            console.log('[API] Duplicate vote detected (409 Conflict)');
            break;
          case 429:
            // レート制限
            errorMessage = '投票の制限に達しました。しばらく待ってから再度お試しください。';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            // サーバーエラー
            errorMessage = 'サーバーエラーが発生しました。しばらくしてから再度お試しください。';
            console.error(`[API] Server error (${response.status}):`, result);
            break;
          default:
            errorMessage = result.message || `エラーが発生しました（ステータス: ${response.status}）`;
        }
        
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        (error as any).responseData = result;
        throw error;
      }
      
      return {
        success: result.success !== false,
        message: result.message || '投票が完了しました',
        stats: result.stats || result.statistics, // 統計データを含める
      };
    } catch (error) {
      // エラーの詳細なログ出力
      if (error instanceof Error) {
        console.error('[API] Vote error:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          responseData: (error as any).responseData,
          stack: DEBUG_MODE ? error.stack : undefined
        });
      } else {
        console.error('[API] Vote error:', error);
      }
      
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
  
  // 都道府県別トップ票取得
  getTopVotesByPrefecture: async (wordId: number): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/words/${wordId}/top-by-prefecture`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top votes: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('[API] Error fetching top votes by prefecture:', error);
      
      // モックデータにフォールバック（開発環境用）
      if (DEBUG_MODE) {
        return {
          wordId,
          headword: 'テスト語',
          reading: 'テストゴ',
          data: [
            { prefecture: '01', prefectureName: '北海道', topAccentType: 'heiban', voteCount: 10, percentage: 60, totalVotes: 17 },
            { prefecture: '02', prefectureName: '青森県', topAccentType: 'atamadaka', voteCount: 5, percentage: 50, totalVotes: 10 },
            // 他の都道府県のモックデータを省略
          ]
        };
      }
      throw error;
    }
  },
  
  // ランキング取得
  getRanking: async (period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<RankingWord[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/words/ranking?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ranking: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Ranking response:', {
          period,
          count: result.data?.words?.length || 0,
          hasData: !!result.data
        });
      }
      
      // レスポンスデータを正規化して返す
      if (result.data && result.data.words) {
        return result.data.words.map((word: any) => ({
          id: word.id,
          rank: word.rank,
          headword: word.headword,
          reading: word.reading,
          category: word.category,
          votesInPeriod: word.votesInPeriod,
          totalVotes: word.totalVotes,
          trend: word.trend,
          change: word.change,
          previousRank: word.previousRank
        }));
      }
      
      return [];
    } catch (error) {
      // 開発環境でバックエンドに接続できない場合はモックデータにフォールバック
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for ranking');
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockRankingWords;
      }
      
      console.error('[API] Error fetching ranking:', error);
      throw error;
    }
  },
  
  // 新着語取得
  getRecentWords: async (limit: number = 10): Promise<Word[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/words/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent words: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (DEBUG_MODE) {
        console.log('[API] Recent words response:', {
          count: result.data?.words?.length || 0,
          hasData: !!result.data
        });
      }
      
      // レスポンスデータを正規化して返す
      if (result.data && result.data.words) {
        return result.data.words.map((word: any) => ({
          id: word.id,
          headword: word.headword,
          reading: word.reading,
          category: word.category,
          totalVotes: word.initialVotes || word.totalVotes || 0,
          prefectureCount: word.prefectureCount || 0,
          lastVoteAt: word.lastVoteAt,
          createdAt: word.approvedAt || word.createdAt,
          submittedBy: word.submittedBy
        }));
      }
      
      return [];
    } catch (error) {
      // 開発環境でバックエンドに接続できない場合はモックデータにフォールバック
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for recent words');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 作成日でソートして返す
        const sorted = [...mockWords].sort((a, b) => {
          const dateA = new Date(a.createdAt || '2024-01-01').getTime();
          const dateB = new Date(b.createdAt || '2024-01-01').getTime();
          return dateB - dateA;
        });
        
        return sorted.slice(0, limit);
      }
      
      console.error('[API] Error fetching recent words:', error);
      throw error;
    }
  },
  
  // 投票可能かチェック
  canVote: async (wordId: number): Promise<{ canVote: boolean; reason?: string; hasVoted?: boolean }> => {
    if (DEBUG_MODE) {
      console.log('[API] Checking if can vote for word:', wordId);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/votes/can-vote/${wordId}`, {
        method: 'GET',
        credentials: 'include', // Cookie送信を確実に行う
        headers: {
          // ローカルストレージからdeviceIdを取得して送信
          ...(typeof window !== 'undefined' && localStorage.getItem('deviceId') && {
            'X-Device-ID': localStorage.getItem('deviceId') || ''
          }),
        },
      });
      
      // レスポンスのテキストを先に取得
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[API] Failed to parse can vote response:', responseText);
        // パースエラーの場合はデフォルトで投票可能にする
        return { canVote: true, reason: 'サーバー応答の解析に失敗しました' };
      }
      
      if (DEBUG_MODE) {
        console.log('[API] Can vote response:', {
          status: response.status,
          canVote: result.data?.canVote,
          hasVoted: result.data?.hasVoted,
          reason: result.data?.existingVote ? '既に投票済み' : result.reason
        });
      }
      
      // ステータスコードに応じた処理
      if (!response.ok) {
        switch (response.status) {
          case 400:
            // バリデーションエラー
            console.warn('[API] Invalid request for can vote check');
            return { canVote: false, reason: 'リクエストが無効です' };
          case 403:
            // 権限エラー（語が未承認など）
            return { canVote: false, reason: result.message || 'この語はまだ投票を受け付けていません' };
          case 404:
            // 語が見つからない
            return { canVote: false, reason: '指定された語が見つかりません' };
          case 500:
          case 502:
          case 503:
          case 504:
            // サーバーエラーの場合はデフォルトで投票可能にする
            console.error(`[API] Server error in can vote check (${response.status})`);
            return { canVote: true, reason: 'サーバーエラーが発生しました' };
          default:
            // その他のエラー
            console.warn(`[API] Unexpected status in can vote check: ${response.status}`);
            return { canVote: true };
        }
      }
      
      // 正常なレスポンスの処理
      // dataプロパティがある場合とない場合の両方に対応
      const data = result.data || result;
      return {
        canVote: data.canVote !== false, // 明示的にfalseでない限りtrue
        reason: data.existingVote ? '既にこの語に投票済みです' : data.reason,
        hasVoted: !!data.hasVoted || !!data.existingVote,
      };
    } catch (error) {
      // エラーの詳細なログ出力
      if (error instanceof Error) {
        console.error('[API] Can vote check error:', {
          message: error.message,
          wordId,
          stack: DEBUG_MODE ? error.stack : undefined
        });
      } else {
        console.error('[API] Can vote check error:', error);
      }
      
      // モックにフォールバック（開発環境用）
      if (DEBUG_MODE && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[API] Falling back to mock data for can vote check');
        return { canVote: true };
      }
      
      // エラー時はデフォルトで投票可能にする（ユーザビリティのため）
      return { canVote: true, reason: 'ステータス確認できませんでした' };
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

  // アプリケーション設定取得
  getAppSettings: async (): Promise<AppSettings> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }
      
      const settings = await response.json();
      
      // 設定値の検証とデフォルト値の補完
      return {
        ...DEFAULT_APP_SETTINGS,
        ...settings,
        display: {
          ...DEFAULT_APP_SETTINGS.display,
          ...(settings.display || {}),
        },
        chart: {
          ...DEFAULT_APP_SETTINGS.chart,
          ...(settings.chart || {}),
        },
        map: {
          ...DEFAULT_APP_SETTINGS.map,
          ...(settings.map || {}),
        },
        vote: {
          ...DEFAULT_APP_SETTINGS.vote,
          ...(settings.vote || {}),
        },
        features: {
          ...DEFAULT_APP_SETTINGS.features,
          ...(settings.features || {}),
        },
      };
    } catch (error) {
      console.error('[API] Settings fetch error:', error);
      
      // エラー時はデフォルト設定を返す
      if (DEBUG_MODE) {
        console.warn('[API] Using default settings');
      }
      return DEFAULT_APP_SETTINGS;
    }
  },

  // サイト統計取得
  getSiteStats: async (): Promise<{
    overview: {
      totalWords: number;
      totalVotes: number;
      totalUsers: number;
      activeWords: number;
      pendingSubmissions: number;
    };
    activity: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    categories: Array<{ category: string; wordCount: number }>;
    popularAccents: Array<{ accentType: string; voteCount: number }>;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch site stats: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      // 開発環境でのフォールバック
      if (DEBUG_MODE) {
        console.warn('[API] Falling back to mock data for site stats');
        return {
          overview: {
            totalWords: 0,
            totalVotes: 0,
            totalUsers: 0,
            activeWords: 0,
            pendingSubmissions: 0,
          },
          activity: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
          },
          categories: [],
          popularAccents: [],
        };
      }
      throw error;
    }
  },
};