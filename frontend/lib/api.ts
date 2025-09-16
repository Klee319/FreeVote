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

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or auth store
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
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
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
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    return {
      error: axiosError.response?.data?.message ||
             axiosError.response?.data?.error ||
             axiosError.message ||
             'An unexpected error occurred',
      status: 'error',
    };
  }
}

// API methods
export const api = {
  // Polls
  getPolls: (params?: { category?: string; sort?: string; search?: string }) =>
    apiCall<any>('GET', '/polls', null, params),

  getPoll: (id: string) =>
    apiCall<any>('GET', `/polls/${id}`),

  votePoll: (id: string, voteData: any) =>
    apiCall<any>('POST', `/polls/${id}/votes`, voteData),

  getPollStats: (id: string, filterBy?: string) =>
    apiCall<any>('GET', `/polls/${id}/stats`, null, { filterBy }),

  getPollByPrefecture: (id: string) =>
    apiCall<any>('GET', `/polls/${id}/top-by-prefecture`),

  getShareMessage: (id: string, option: number) =>
    apiCall<any>('GET', `/polls/${id}/share-message`, null, { option }),

  // Auth
  register: (data: any) =>
    apiCall<any>('POST', '/auth/register', data),

  login: (credentials: any) =>
    apiCall<any>('POST', '/auth/login', credentials),

  socialLogin: (data: any) =>
    apiCall<any>('POST', '/auth/social-login', data),

  logout: () =>
    apiCall<any>('POST', '/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiCall<any>('POST', '/auth/refresh', { refreshToken }),

  getMe: () =>
    apiCall<any>('GET', '/auth/me'),

  // Requests
  submitRequest: (data: any) =>
    apiCall<any>('POST', '/requests', data),

  likeRequest: (id: string) =>
    apiCall<any>('POST', `/requests/${id}/like`),

  // Referrals
  trackReferral: (data: { sharedBy: string; pollId: string; visitorToken: string }) =>
    apiCall<any>('POST', '/referrals/visit', data),

  getUserReferrals: (userId: string) =>
    apiCall<any>('GET', `/users/${userId}/referrals`),

  // Admin (protected endpoints)
  admin: {
    createPoll: (data: any) =>
      apiCall<any>('POST', '/admin/polls', data),

    updatePoll: (id: string, data: any) =>
      apiCall<any>('PUT', `/admin/polls/${id}`, data),

    deletePoll: (id: string) =>
      apiCall<any>('DELETE', `/admin/polls/${id}`),

    getRequests: () =>
      apiCall<any>('GET', '/admin/requests'),

    importPolls: (data: any) =>
      apiCall<any>('POST', '/admin/import', data),
  },
};

export default api;