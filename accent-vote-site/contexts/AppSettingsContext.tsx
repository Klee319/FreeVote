'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppSettings, DEFAULT_APP_SETTINGS } from '@/types/settings';

interface AppSettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  error: Error | null;
  refetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

interface AppSettingsProviderProps {
  children: React.ReactNode;
  initialSettings?: AppSettings;
}

export function AppSettingsProvider({ 
  children, 
  initialSettings 
}: AppSettingsProviderProps) {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<AppSettings>(
    initialSettings || DEFAULT_APP_SETTINGS
  );

  // React Queryを使用して設定を取得
  const { 
    data: fetchedSettings, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['appSettings'],
    queryFn: api.getAppSettings,
    staleTime: 1000 * 60 * 30, // 30分間はキャッシュを使用
    gcTime: 1000 * 60 * 60, // 1時間後にガベージコレクション
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // 取得した設定をローカル状態に反映
  useEffect(() => {
    if (fetchedSettings) {
      setLocalSettings(fetchedSettings);
      // ローカルストレージにもキャッシュ
      try {
        localStorage.setItem('appSettings', JSON.stringify(fetchedSettings));
        localStorage.setItem('appSettingsTimestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to cache settings in localStorage:', e);
      }
    }
  }, [fetchedSettings]);

  // 初回マウント時にローカルストレージから設定を読み込み
  useEffect(() => {
    if (!fetchedSettings && !isLoading) {
      try {
        const cachedSettings = localStorage.getItem('appSettings');
        const cachedTimestamp = localStorage.getItem('appSettingsTimestamp');
        
        if (cachedSettings && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          // 1時間以内のキャッシュなら使用
          if (age < 1000 * 60 * 60) {
            const parsedSettings = JSON.parse(cachedSettings);
            setLocalSettings({
              ...DEFAULT_APP_SETTINGS,
              ...parsedSettings,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load cached settings:', e);
      }
    }
  }, [fetchedSettings, isLoading]);

  // 設定の再取得
  const refetchSettings = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refetch settings:', error);
    }
  }, [refetch]);

  // 設定の更新（ローカルのみ、必要に応じてAPIに送信する機能を追加可能）
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setLocalSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      };
      
      // ローカルストレージも更新
      try {
        localStorage.setItem('appSettings', JSON.stringify(updated));
        localStorage.setItem('appSettingsTimestamp', Date.now().toString());
      } catch (e) {
        console.warn('Failed to update cached settings:', e);
      }
      
      // React Queryのキャッシュも更新
      queryClient.setQueryData(['appSettings'], updated);
      
      return updated;
    });
  }, [queryClient]);

  const contextValue: AppSettingsContextValue = {
    settings: localSettings,
    isLoading,
    error: error as Error | null,
    refetchSettings,
    updateSettings,
  };

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// カスタムフック
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  
  if (!context) {
    // コンテキスト外で使用された場合はデフォルト値を返す
    console.warn('useAppSettings must be used within AppSettingsProvider. Using default settings.');
    return {
      settings: DEFAULT_APP_SETTINGS,
      isLoading: false,
      error: null,
      refetchSettings: async () => {},
      updateSettings: () => {},
    };
  }
  
  return context;
}

// 個別の設定カテゴリーを取得するヘルパーフック
export function useDisplaySettings() {
  const { settings } = useAppSettings();
  return settings.display;
}

export function useChartSettings() {
  const { settings } = useAppSettings();
  return settings.chart;
}

export function useMapSettings() {
  const { settings } = useAppSettings();
  return settings.map;
}

export function useVoteSettings() {
  const { settings } = useAppSettings();
  return settings.vote;
}

export function useFeatureFlags() {
  const { settings } = useAppSettings();
  return settings.features;
}