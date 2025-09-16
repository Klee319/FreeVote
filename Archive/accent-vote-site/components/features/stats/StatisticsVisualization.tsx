'use client';

import { useState, useMemo } from 'react';
import { AccentStat, PrefectureStat } from '@/types';
import { getAccentTypeName, getAccentTypeColor, getPrefectureName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMapSettings, useChartSettings } from '@/contexts/AppSettingsContext';
import { JapanMapVisualization } from './JapanMapVisualization';
import { CommonStatisticsView, StatisticsMode, ViewType } from './CommonStatisticsView';
import { CommonMapVisualization, MapDataItem } from './CommonMapVisualization';

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
  selectedPrefecture,
  onPrefectureSelect,
}: StatisticsVisualizationProps) {
  const mapSettings = useMapSettings();
  const chartSettings = useChartSettings();
  
  const [statisticsMode, setStatisticsMode] = useState<StatisticsMode>('overall');
  const [viewType, setViewType] = useState<ViewType>('ranking');
  const [selectedPref, setSelectedPref] = useState(selectedPrefecture || mapSettings.defaultSelectedPrefecture);

  const handlePrefectureSelect = (prefecture: string) => {
    setSelectedPref(prefecture);
    onPrefectureSelect?.(prefecture);
  };

  // 選択された都道府県のデータを取得
  const selectedPrefData = prefectureStats.find(p => p.prefectureCode === selectedPref);

  // 全国統計の最大値を取得（バーの幅計算用）
  const maxVotes = Math.max(...nationalStats.map(s => s.count));

  // 年代別・性別の集計データを生成（モックデータ）
  const demographicData = useMemo(() => {
    // TODO: 実際のAPIからデータを取得
    return {
      byAge: {
        '10s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.1), percentage: 10 })),
        '20s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.25), percentage: 25 })),
        '30s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.2), percentage: 20 })),
        '40s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.15), percentage: 15 })),
        '50s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.15), percentage: 15 })),
        '60s': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.1), percentage: 10 })),
        '70s+': nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.05), percentage: 5 })),
      },
      byGender: {
        male: nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.45), percentage: 45 })),
        female: nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.5), percentage: 50 })),
        other: nationalStats.map(s => ({ accentType: s.accentType, count: Math.floor(s.count * 0.05), percentage: 5 })),
      }
    };
  }, [nationalStats]);

  // 現在のモードに応じた表示データを取得
  const getCurrentModeData = () => {
    switch (statisticsMode) {
      case 'overall':
        return nationalStats;
      case 'age':
        // 年代別の最多アクセントを表示
        return Object.entries(demographicData.byAge).map(([age, stats]) => {
          const maxStat = stats.reduce((max, s) => s.count > max.count ? s : max);
          return {
            label: getAgeLabel(age),
            ...maxStat
          };
        });
      case 'gender':
        // 性別の最多アクセントを表示
        return Object.entries(demographicData.byGender).map(([gender, stats]) => {
          const maxStat = stats.reduce((max, s) => s.count > max.count ? s : max);
          return {
            label: getGenderLabel(gender),
            ...maxStat
          };
        });
      case 'prefecture':
        return prefectureStats;
      default:
        return nationalStats;
    }
  };

  const getAgeLabel = (age: string) => {
    const labels: Record<string, string> = {
      '10s': '10代',
      '20s': '20代',
      '30s': '30代',
      '40s': '40代',
      '50s': '50代',
      '60s': '60代',
      '70s+': '70代以上'
    };
    return labels[age] || age;
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      male: '男性',
      female: '女性',
      other: 'その他'
    };
    return labels[gender] || gender;
  };

  return (
    <CommonStatisticsView
      mode={statisticsMode}
      viewType={viewType}
      onModeChange={setStatisticsMode}
      onViewTypeChange={setViewType}
      title="集計状況"
    >

      {statisticsMode === 'overall' ? (
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
                  {stat.count}票 ({(stat.percentage || 0).toFixed(1)}%)
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full" style={{ height: `${chartSettings.defaultBarHeight}px` }}>
                <div
                  className="rounded-full flex items-center justify-end pr-2 transition-all"
                  style={{
                    width: `${Math.min((stat.count / maxVotes) * 100, chartSettings.maxBarWidth)}%`,
                    height: `${chartSettings.defaultBarHeight}px`,
                    backgroundColor: getAccentTypeColor(stat.accentType),
                  }}
                >
                  {(stat.percentage || 0) >= chartSettings.showPercentageThreshold && (
                    <span className="text-xs text-white font-medium">
                      {(stat.percentage || 0).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : statisticsMode === 'prefecture' && viewType === 'ranking' ? (
        /* 都道府県別統計表示 */
        <div>
          <div className="mb-4">
            <label htmlFor="prefecture-select" className="block text-sm font-medium text-gray-700 mb-2">
              都道府県を選択:
            </label>
            <select
              id="prefecture-select"
              value={selectedPref}
              onChange={(e) => handlePrefectureSelect(e.target.value)}
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
                {getPrefectureName(selectedPref)}のアクセント分布
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
                        {voteStat.count}票 ({(voteStat.percentage || 0).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full" style={{ height: `${chartSettings.defaultBarHeight}px` }}>
                      <div
                        className="rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{
                          width: `${Math.min((voteStat.count / maxPrefVotes) * 100, chartSettings.maxBarWidth)}%`,
                          height: `${chartSettings.defaultBarHeight}px`,
                          backgroundColor: getAccentTypeColor(accentType),
                        }}
                      >
                        {(voteStat.percentage || 0) >= chartSettings.showPercentageThreshold && (
                          <span className="text-xs text-white font-medium">
                            {(voteStat.percentage || 0).toFixed(1)}%
                          </span>
                        )}
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
      ) : statisticsMode === 'prefecture' && viewType === 'map' ? (
        /* 地図表示 */
        <div>
          {(() => {
            // 各県の1位アクセントデータを準備
            const mapData: MapDataItem[] = prefectureStats.map(pref => {
              const topAccent = pref.dominantAccent;
              const topAccentData = pref.accentDistribution[topAccent];
              
              return {
                prefectureCode: pref.prefectureCode,
                name: getPrefectureName(pref.prefectureCode),
                topItem: getAccentTypeName(topAccent),
                topItemCount: topAccentData?.count || 0,
                totalVotes: pref.totalVotes,
                color: getAccentTypeColor(topAccent),
                percentage: topAccentData?.percentage || 0,
              };
            });

            return (
              <CommonMapVisualization
                data={mapData}
                selectedPrefecture={selectedPref}
                onPrefectureSelect={handlePrefectureSelect}
                title="都道府県別アクセント分布マップ"
                colorScheme="category"
                showLegend={true}
              />
            );
          })()}
          
          {/* 選択された都道府県の詳細情報 */}
          {selectedPref && prefectureStats.find(p => p.prefectureCode === selectedPref) && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">
                {getPrefectureName(selectedPref)}の詳細情報
              </h3>
              {(() => {
                const prefData = prefectureStats.find(p => p.prefectureCode === selectedPref);
                if (!prefData) return null;
                
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">最多アクセント型:</span>
                      <span className="font-medium">{getAccentTypeName(prefData.dominantAccent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">総投票数:</span>
                      <span className="font-medium">{prefData.totalVotes}票</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary-100">
                      {Object.entries(prefData.accentDistribution).map(([accentType, voteStat]) => (
                        <div key={accentType} className="flex justify-between items-center py-1">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: getAccentTypeColor(accentType) }}
                            />
                            <span className="text-sm">{getAccentTypeName(accentType)}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {voteStat.count}票 ({(voteStat.percentage || 0).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : statisticsMode === 'age' ? (
        /* 年代別統計表示 */
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">年代別アクセント分布</h3>
          {Object.entries(demographicData.byAge).map(([age, stats]) => {
            const maxStat = stats.reduce((max, s) => s.count > max.count ? s : max);
            const totalVotes = stats.reduce((sum, s) => sum + s.count, 0);
            return (
              <div key={age} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{getAgeLabel(age)}</span>
                  <span className="text-sm text-gray-600">{totalVotes}票</span>
                </div>
                <div className="space-y-2">
                  {stats.map((stat) => (
                    <div key={stat.accentType} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getAccentTypeColor(stat.accentType) }}
                      />
                      <span className="text-sm">{getAccentTypeName(stat.accentType)}</span>
                      <span className="text-sm text-gray-500 ml-auto">
                        {stat.count}票 ({stat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : statisticsMode === 'gender' ? (
        /* 性別統計表示 */
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">性別アクセント分布</h3>
          {Object.entries(demographicData.byGender).map(([gender, stats]) => {
            const maxStat = stats.reduce((max, s) => s.count > max.count ? s : max);
            const totalVotes = stats.reduce((sum, s) => sum + s.count, 0);
            return (
              <div key={gender} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{getGenderLabel(gender)}</span>
                  <span className="text-sm text-gray-600">{totalVotes}票</span>
                </div>
                <div className="space-y-2">
                  {stats.map((stat) => (
                    <div key={stat.accentType} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getAccentTypeColor(stat.accentType) }}
                      />
                      <span className="text-sm">{getAccentTypeName(stat.accentType)}</span>
                      <span className="text-sm text-gray-500 ml-auto">
                        {stat.count}票 ({stat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </CommonStatisticsView>
  );
}