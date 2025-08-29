'use client';

import { useState } from 'react';
import { AccentStat, PrefectureStat } from '@/types';
import { getAccentTypeName, getAccentTypeColor, getPrefectureName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ChartBarIcon, MapIcon } from '@heroicons/react/24/outline';

interface StatisticsVisualizationProps {
  wordId: number;
  nationalStats: AccentStat[];
  prefectureStats: PrefectureStat[];
  selectedPrefecture?: string;
  onPrefectureSelect?: (prefecture: string) => void;
}

export function StatisticsVisualization({
  wordId,
  nationalStats,
  prefectureStats,
  selectedPrefecture = '13',
  onPrefectureSelect,
}: StatisticsVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'national' | 'prefecture'>('national');

  // 選択された都道府県のデータを取得
  const selectedPrefData = prefectureStats.find(p => p.prefectureCode === selectedPrefecture);

  // 全国統計の最大値を取得（バーの幅計算用）
  const maxVotes = Math.max(...nationalStats.map(s => s.count));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">アクセント分布</h2>
        
        {/* タブ切替 */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('national')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors flex items-center space-x-2',
              activeTab === 'national'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">全国統計</span>
          </button>
          <button
            onClick={() => setActiveTab('prefecture')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors flex items-center space-x-2',
              activeTab === 'prefecture'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-sm font-medium">都道府県別</span>
          </button>
        </div>
      </div>

      {activeTab === 'national' ? (
        /* 全国統計表示 */
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">全国のアクセント分布</h3>
          
          {nationalStats.map((stat) => (
            <div key={stat.accentType} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getAccentTypeColor(stat.accentType) }}
                  />
                  <span className="font-medium">{getAccentTypeName(stat.accentType)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {stat.count}票 ({stat.percentage.toFixed(1)}%)
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                  style={{
                    width: `${(stat.count / maxVotes) * 100}%`,
                    backgroundColor: getAccentTypeColor(stat.accentType),
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {stat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 都道府県別統計表示 */
        <div>
          <div className="mb-4">
            <label htmlFor="prefecture-select" className="block text-sm font-medium text-gray-700 mb-2">
              都道府県を選択:
            </label>
            <select
              id="prefecture-select"
              value={selectedPrefecture}
              onChange={(e) => onPrefectureSelect?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              {prefectureStats.map((pref) => (
                <option key={pref.prefectureCode} value={pref.prefectureCode}>
                  {getPrefectureName(pref.prefectureCode)} ({pref.totalVotes}票)
                </option>
              ))}
            </select>
          </div>

          {selectedPrefData ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">
                {getPrefectureName(selectedPrefecture)}のアクセント分布
              </h3>
              
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="text-sm text-primary-700 mb-1">最多アクセント型</div>
                <div className="text-lg font-bold text-primary-900">
                  {getAccentTypeName(selectedPrefData.dominantAccent)}
                </div>
              </div>

              {Object.entries(selectedPrefData.accentDistribution).map(([accentType, voteStat]) => {
                const maxPrefVotes = Math.max(
                  ...Object.values(selectedPrefData.accentDistribution).map(v => v.count)
                );
                
                return (
                  <div key={accentType} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getAccentTypeColor(accentType) }}
                        />
                        <span className="font-medium">{getAccentTypeName(accentType)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {voteStat.count}票 ({voteStat.percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{
                          width: `${(voteStat.count / maxPrefVotes) * 100}%`,
                          backgroundColor: getAccentTypeColor(accentType),
                        }}
                      >
                        <span className="text-xs text-white font-medium">
                          {voteStat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 text-sm text-gray-500">
                総投票数: {selectedPrefData.totalVotes}票
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              この都道府県のデータはまだありません
            </div>
          )}
        </div>
      )}

      {/* 簡易地図表示（実際の実装では ECharts を使用） */}
      {activeTab === 'prefecture' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            ※ 地図表示機能は現在開発中です。都道府県別の統計は上記のドロップダウンからご確認ください。
          </p>
        </div>
      )}
    </div>
  );
}