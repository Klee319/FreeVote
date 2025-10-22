import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiResponse } from '@/types';

// API base URL - can be configured via environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token and user token
apiClient.interceptors.request.use(
  (config) => {
    // Get auth token from localStorage or auth store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }

    // Get user token from localStorage (for guest users)
    // Extract pollId from URL if present (e.g., /polls/:id/...)
    const urlMatch = config.url?.match(/\/polls\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      const pollId = urlMatch[1];
      const userToken = localStorage.getItem(`vote-token-${pollId}`);
      if (userToken) {
        config.headers['x-user-token'] = userToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - handle refresh or redirect to login
      // This could trigger a token refresh attempt
      console.error('Authentication error - token may be expired');

      // Clear auth storage and redirect to login
      localStorage.removeItem('auth-storage');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic API call wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request<{ success: boolean; data?: T; message?: string }>({
      method,
      url: endpoint,
      data,
      params,
    });

    // バックエンドは { success: true, data: {...} } 形式で返す
    if (response.data?.success && response.data?.data !== undefined) {
      return {
        data: response.data.data,
        status: 'success',
      };
    } else if (response.data?.success) {
      // dataフィールドがない成功レスポンス（削除など）
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: response.data as any,
        status: 'success',
      };
    } else {
      // 成功フラグがfalseの場合
      return {
        error: response.data?.message || 'Request failed',
        status: 'error',
      };
    }
  } catch (error) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string | { message?: string; code?: string };
    }>;

    // バックエンドのエラー形式に対応（様々な形式に対応）
    let errorMessage = 'An unexpected error occurred';

    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // 1. error.messageの形式を確認（バックエンドの標準形式）
      if (typeof data.error === 'object' && data.error !== null) {
        // エラーオブジェクトからメッセージを取得
        if ('message' in data.error && typeof data.error.message === 'string') {
          errorMessage = data.error.message;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ('msg' in data.error && typeof (data.error as any).msg === 'string') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorMessage = (data.error as any).msg;
        } else {
          // エラーオブジェクトを文字列に変換
          errorMessage = JSON.stringify(data.error);
        }
      }
      // 2. 直接messageフィールドがある場合
      else if (typeof data.message === 'string') {
        errorMessage = data.message;
      }
      // 3. errorが文字列の場合
      else if (typeof data.error === 'string') {
        errorMessage = data.error;
      }
      // 4. dataそのものが文字列の場合
      else if (typeof data === 'string') {
        errorMessage = data;
      }
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }

    // 確実に文字列を返す
    return {
      error: String(errorMessage),
      status: 'error',
    };
  }
}

// API methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api = {
  // Polls
  getPolls: (params?: { category?: string; sort?: string; search?: string; active?: boolean; order?: string }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', '/polls', null, params),

  getPoll: (id: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${id}`),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  votePoll: (id: string, voteData: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/polls/${id}/votes`, voteData),

  getPollStats: (id: string, filterBy?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${id}/stats`, null, { filterBy }),

  getPollByPrefecture: (id: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${id}/top-by-prefecture`),

  getShareMessage: (id: string, option: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${id}/share-message`, null, { option }),

  // Auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (data: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/auth/register', data),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (credentials: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/auth/login', credentials),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socialLogin: (data: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/auth/social-login', data),

  logout: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/auth/logout'),

  refreshToken: (refreshToken: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/auth/refresh', { refreshToken }),

  getMe: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', '/auth/me'),

  // Requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitRequest: (data: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/requests', data),

  likeRequest: (id: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/requests/${id}/like`),

  // Referrals
  trackReferral: (data: { sharedBy: string; pollId: string; visitorToken: string }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', '/referrals/visit', data),

  getUserReferrals: (userId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/users/${userId}/referrals`),

  // Stats Access
  checkStatsAccess: (pollId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${pollId}/check-stats-access`),

  grantStatsAccess: (pollId: string, userToken: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/polls/${pollId}/grant-stats-access`, { userToken }),

  // Share-based Stats Access (simplified for guest users)
  hasStatsAccess: (pollId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${pollId}/has-stats-access`),

  grantStatsAccessOnShare: (pollId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/polls/${pollId}/share-grant-access`),

  // Comments
  getComments: (pollId: string, page: number = 1, limit: number = 10, sort: 'new' | 'popular' = 'new') =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('GET', `/polls/${pollId}/comments`, null, { page, limit, sort }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createComment: (pollId: string, data: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/polls/${pollId}/comments`, data),

  deleteComment: (pollId: string, commentId: string, userToken?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('DELETE', `/polls/${pollId}/comments/${commentId}`, { userToken }),

  toggleCommentLike: (pollId: string, commentId: string, userToken?: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiCall<any>('POST', `/polls/${pollId}/comments/${commentId}/like`, { userToken }),

  // Admin (protected endpoints)
  admin: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPoll: (data: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiCall<any>('POST', '/admin/polls', data),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePoll: (id: string, data: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiCall<any>('PUT', `/admin/polls/${id}`, data),

    deletePoll: (id: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiCall<any>('DELETE', `/admin/polls/${id}`),

    getRequests: () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiCall<any>('GET', '/admin/requests'),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importPolls: (data: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiCall<any>('POST', '/admin/import', data),
  },
};

export default api;