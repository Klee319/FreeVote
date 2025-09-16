import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { LoginCredentials, RegisterData } from '@/types';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    setUser,
    setTokens,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
    isLoading,
  } = useAuthStore();

  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    const response = await api.getMe();

    if (response.status === 'success' && response.data) {
      setUser(response.data);
    } else {
      storeLogout();
    }
    setLoading(false);
  };

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setLoading(true);

    const response = await api.login(credentials);

    if (response.status === 'success' && response.data) {
      const { user, accessToken, refreshToken } = response.data;
      storeLogin(user, { accessToken, refreshToken });
      router.push('/');
      return { success: true };
    } else {
      // エラーメッセージを安全に文字列として取得
      let errorMessage = 'ログインに失敗しました';

      if (response.error) {
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (typeof response.error === 'object' && response.error !== null) {
          // エラーオブジェクトの場合、messageプロパティを探す
          if ('message' in response.error && typeof (response.error as any).message === 'string') {
            errorMessage = (response.error as any).message;
          } else {
            // それでも文字列が取得できない場合はJSONに変換
            errorMessage = JSON.stringify(response.error);
          }
        }
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);

    const response = await api.register(data);

    if (response.status === 'success' && response.data) {
      const { user, accessToken, refreshToken } = response.data;
      storeLogin(user, { accessToken, refreshToken });
      router.push('/');
      return { success: true };
    } else {
      // エラーメッセージを安全に文字列として取得
      let errorMessage = '登録に失敗しました';

      if (response.error) {
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (typeof response.error === 'object' && response.error !== null) {
          // エラーオブジェクトの場合、messageプロパティを探す
          if ('message' in response.error && typeof (response.error as any).message === 'string') {
            errorMessage = (response.error as any).message;
          } else {
            // それでも文字列が取得できない場合はJSONに変換
            errorMessage = JSON.stringify(response.error);
          }
        }
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const socialLogin = async (provider: string, providerId: string, userData?: any) => {
    setError(null);
    setLoading(true);

    const response = await api.socialLogin({
      provider,
      providerId,
      ...userData,
    });

    if (response.status === 'success' && response.data) {
      const { user, accessToken, refreshToken } = response.data;
      storeLogin(user, { accessToken, refreshToken });
      router.push('/');
      return { success: true };
    } else {
      // エラーメッセージを安全に文字列として取得
      let errorMessage = 'SNS連携ログインに失敗しました';

      if (response.error) {
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (typeof response.error === 'object' && response.error !== null) {
          // エラーオブジェクトの場合、messageプロパティを探す
          if ('message' in response.error && typeof (response.error as any).message === 'string') {
            errorMessage = (response.error as any).message;
          } else {
            // それでも文字列が取得できない場合はJSONに変換
            errorMessage = JSON.stringify(response.error);
          }
        }
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    storeLogout();
    router.push('/');
    setLoading(false);
  };

  const refreshToken = async () => {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return false;

    try {
      const { state } = JSON.parse(authStorage);
      if (!state?.tokens?.refreshToken) return false;

      const response = await api.refreshToken(state.tokens.refreshToken);

      if (response.status === 'success' && response.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setTokens({ accessToken, refreshToken: newRefreshToken });
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }

    return false;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    socialLogin,
    logout,
    checkAuth,
    refreshToken,
  };
}