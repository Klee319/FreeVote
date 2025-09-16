'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 匿名ユーザー情報の型定義
 */
export interface AnonymousUser {
  deviceId: string;
  ageGroup: string;
  gender: string;
  prefectureCode: string;
  prefecture?: {
    code: string;
    name: string;
  };
  registeredAt: string;
  lastActiveAt: string;
}

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  user: AnonymousUser | null;
  isLoading: boolean;
  isRegistered: boolean;
  hasSkippedAttributes: boolean;
  hasAttributes: boolean;
  error: string | null;
  csrfToken: string | null;
  register: (data: RegisterData) => Promise<void>;
  updateAttributes: (data: Partial<RegisterData>) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  verifyCookie: () => Promise<void>;
}

/**
 * 登録データの型定義
 */
interface RegisterData {
  age: string;
  gender: string;
  prefecture: string;
}

// 認証コンテキスト
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Cookie認証プロバイダー
 */
export function CookieAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasSkippedAttributes, setHasSkippedAttributes] = useState(false);
  const [hasAttributes, setHasAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  /**
   * CSRFトークンをヘッダーに追加するヘルパー関数
   */
  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = csrfToken || localStorage.getItem('csrf-token');
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    
    return headers;
  }, [csrfToken]);

  /**
   * Cookie検証
   */
  const verifyCookie = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresRegistration) {
          setIsRegistered(false);
          setUser(null);
          // スキップ状態をチェック
          const skipped = sessionStorage.getItem('registration-skipped') === 'true';
          setHasSkippedAttributes(skipped);
          setHasAttributes(false);
        } else {
          setIsRegistered(true);
          setUser(data.user);
          setHasSkippedAttributes(false);
          // 属性情報の有無をチェック
          const userHasAttributes = Boolean(
            data.user?.ageGroup || 
            data.user?.gender || 
            data.user?.prefectureCode ||
            data.user?.prefecture
          );
          setHasAttributes(userHasAttributes);
          
          // ユーザー情報をローカルストレージに保存（フォールバック用）
          if (data.user) {
            localStorage.setItem('anonymous-user', JSON.stringify(data.user));
          }
        }

        // CSRFトークンを保存
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
          localStorage.setItem('csrf-token', data.csrfToken);
        }
      }
    } catch (err) {
      console.error('Cookie verification failed:', err);
      setError('認証の確認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 匿名ユーザー登録
   */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/anonymous-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '登録に失敗しました');
      }

      if (result.success) {
        setUser(result.data.user);
        setIsRegistered(true);
        setHasSkippedAttributes(false);
        // 属性情報の有無をチェック
        const userHasAttributes = Boolean(
          result.data.user?.ageGroup || 
          result.data.user?.gender || 
          result.data.user?.prefectureCode ||
          result.data.user?.prefecture
        );
        setHasAttributes(userHasAttributes);
        // スキップ状態をクリア
        sessionStorage.removeItem('registration-skipped');
        
        // ユーザー情報をローカルストレージに保存（フォールバック用）
        localStorage.setItem('anonymous-user', JSON.stringify(result.data.user));

        // CSRFトークンを保存
        if (result.data.csrfToken) {
          setCsrfToken(result.data.csrfToken);
          localStorage.setItem('csrf-token', result.data.csrfToken);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録中にエラーが発生しました';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 属性更新
   */
  const updateAttributes = useCallback(async (data: Partial<RegisterData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/attributes', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新に失敗しました');
      }

      if (result.success) {
        setUser(result.data.user);
        // 属性情報の有無を更新
        const userHasAttributes = Boolean(
          result.data.user?.ageGroup || 
          result.data.user?.gender || 
          result.data.user?.prefectureCode ||
          result.data.user?.prefecture
        );
        setHasAttributes(userHasAttributes);
        // 属性が入力されたらスキップ状態をクリア
        if (userHasAttributes) {
          setHasSkippedAttributes(false);
          sessionStorage.removeItem('registration-skipped');
        }
        
        // ユーザー情報をローカルストレージに保存（フォールバック用）
        localStorage.setItem('anonymous-user', JSON.stringify(result.data.user));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新中にエラーが発生しました';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  /**
   * セッションリフレッシュ
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'セッションの更新に失敗しました');
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  }, [getHeaders]);

  /**
   * ログアウト
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setUser(null);
        setIsRegistered(false);
        setHasSkippedAttributes(false);
        setHasAttributes(false);
        setCsrfToken(null);
        localStorage.removeItem('csrf-token');
        localStorage.removeItem('anonymous-user');
        sessionStorage.removeItem('registration-skipped');
        router.push('/');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 初回マウント時にCookie検証を実行
  useEffect(() => {
    // 初回マウント時のみ実行
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        // Cookie検証を実行
        await verifyCookie();
        
        // スキップ状態のチェック
        const skipped = sessionStorage.getItem('registration-skipped') === 'true';
        if (skipped && !isRegistered) {
          setHasSkippedAttributes(true);
        }
      } catch (error) {
        // 初期化エラーの処理
        // エラー時はローカルストレージから情報を復元を試みる
        const savedUser = localStorage.getItem('anonymous-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsRegistered(true);
          } catch (parseError) {
            // 保存されたユーザーデータのパースエラー
          }
        }
      }
    };
    
    initializeAuth();
    
    // sessionStorageの変更を監視
    const checkSkipStatus = () => {
      const skipped = sessionStorage.getItem('registration-skipped') === 'true';
      if (skipped && !isRegistered) {
        setHasSkippedAttributes(true);
      }
    };
    
    window.addEventListener('storage', checkSkipStatus);
    
    return () => {
      mounted = false;
      window.removeEventListener('storage', checkSkipStatus);
    };
  }, []); // 依存配列を空にして初回マウント時のみ実行

  // 定期的にセッションをリフレッシュ（15分ごと）
  useEffect(() => {
    if (!isRegistered) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isRegistered, refreshSession]);

  const value: AuthContextType = {
    user,
    isLoading,
    isRegistered,
    hasSkippedAttributes,
    hasAttributes,
    error,
    csrfToken,
    register,
    updateAttributes,
    refreshSession,
    logout,
    verifyCookie,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Cookie認証フック
 */
export function useCookieAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCookieAuth must be used within a CookieAuthProvider');
  }
  return context;
}

/**
 * 認証が必要なページで使用するフック
 */
export function useRequireAuth(redirectTo: string = '/') {
  const { isRegistered, isLoading } = useCookieAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isRegistered) {
      router.push(redirectTo);
    }
  }, [isRegistered, isLoading, router, redirectTo]);

  return { isRegistered, isLoading };
}