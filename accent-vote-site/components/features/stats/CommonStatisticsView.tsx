'use client';

import { useState } from 'react';
import { ChartBarIcon, MapIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type StatisticsMode = 'overall' | 'prefecture' | 'age' | 'gender';
export type ViewType = 'ranking' | 'map';

interface CommonStatisticsViewProps {
  mode: StatisticsMode;
  viewType: ViewType;
  onModeChange: (mode: StatisticsMode) => void;
  onViewTypeChange: (type: ViewType) => void;
  children: React.ReactNode;
  title?: string;
}

export function CommonStatisticsView({
  mode,
  viewType,
  onModeChange,
  onViewTypeChange,
  children,
  title = '集計状況'
}: CommonStatisticsViewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        
        {/* モード切替 */}
        <div className="flex gap-2">
          {/* ソートオプション */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onModeChange('overall')}
              className={cn(
                'px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5',
                mode === 'overall'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">総合順位</span>
            </button>
            <button
              onClick={() => onModeChange('prefecture')}
              className={cn(
                'px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5',
                mode === 'prefecture'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">県別</span>
            </button>
            <button
              onClick={() => onModeChange('age')}
              className={cn(
                'px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5',
                mode === 'age'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">年代別</span>
            </button>
            <button
              onClick={() => onModeChange('gender')}
              className={cn(
                'px-3 py-2 rounded-md transition-colors flex items-center space-x-1.5',
                mode === 'gender'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">性別別</span>
            </button>
          </div>

          {/* 表示形式切替（県別モードのみ） */}
          {mode === 'prefecture' && (
            <div className="flex bg-gray-100 rounded-lg p-1 ml-2">
              <button
                onClick={() => onViewTypeChange('ranking')}
                className={cn(
                  'px-3 py-2 rounded-md transition-colors',
                  viewType === 'ranking'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <span className="text-sm font-medium">ランキング</span>
              </button>
              <button
                onClick={() => onViewTypeChange('map')}
                className={cn(
                  'px-3 py-2 rounded-md transition-colors',
                  viewType === 'map'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <span className="text-sm font-medium">地図</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}