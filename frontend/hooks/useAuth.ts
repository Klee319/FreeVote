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
      setError(response.error || 'ログインに失敗しました');
      setLoading(false);
      return { success: false, error: response.error };
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
      setError(response.error || '登録に失敗しました');
      setLoading(false);
      return { success: false, error: response.error };
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
      setError(response.error || 'SNS連携ログインに失敗しました');
      setLoading(false);
      return { success: false, error: response.error };
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