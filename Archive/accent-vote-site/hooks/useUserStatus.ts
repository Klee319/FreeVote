'use client';

import { useState, useEffect } from 'react';

interface UserStatus {
  isLoggedIn: boolean;
  userId: string | null;
  userName: string | null;
  userRole: 'admin' | 'user' | null;
}

export function useUserStatus() {
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isLoggedIn: false,
    userId: null,
    userName: null,
    userRole: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージまたはセッションストレージから情報を取得
    const checkUserStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserStatus({
            isLoggedIn: true,
            userId: user.id,
            userName: user.name,
            userRole: user.role || 'user',
          });
        }
      } catch (error) {
        console.error('ユーザーステータスの取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  const login = (userData: Omit<UserStatus, 'isLoggedIn'>) => {
    const user = {
      id: userData.userId,
      name: userData.userName,
      role: userData.userRole,
    };
    localStorage.setItem('user', JSON.stringify(user));
    setUserStatus({
      ...userData,
      isLoggedIn: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUserStatus({
      isLoggedIn: false,
      userId: null,
      userName: null,
      userRole: null,
    });
  };

  return {
    ...userStatus,
    isLoading,
    login,
    logout,
  };
}