'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number;
  unit: string;
  icon: string;
}

export function StatisticsSummary() {
  const [displayStats, setDisplayStats] = useState<StatItem[]>([
    { label: '総語数', value: 0, unit: '語', icon: '📚' },
    { label: '総投票数', value: 0, unit: '票', icon: '🗳️' },
    { label: '参加県数', value: 0, unit: '県', icon: '🗾' },
    { label: '今日の投票', value: 0, unit: '票', icon: '📊' },
  ]);

  // APIからデータを取得
  const { data: siteStats, isLoading } = useQuery({
    queryKey: ['siteStats'],
    queryFn: () => api.getSiteStats(),
    refetchInterval: 60000, // 1分ごとに更新
  });

  useEffect(() => {
    if (siteStats) {
      // APIデータから統計情報を作成
      const targetStats = [
        { 
          label: '総語数', 
          value: siteStats.overview.totalWords, 
          unit: '語', 
          icon: '📚' 
        },
        { 
          label: '総投票数', 
          value: siteStats.overview.totalVotes, 
          unit: '票', 
          icon: '🗳️' 
        },
        { 
          label: '参加県数', 
          value: 47, // TODO: 実際の参加県数をAPIから取得
          unit: '県', 
          icon: '🗾' 
        },
        { 
          label: '今日の投票', 
          value: siteStats.activity.today, 
          unit: '票', 
          icon: '📊' 
        },
      ];

      // アニメーション効果でカウントアップ
      const duration = 1000;
      const steps = 20;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setDisplayStats(
          targetStats.map((target) => ({
            ...target,
            value: Math.floor(target.value * progress),
          }))
        );

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [siteStats]);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 text-center border border-gray-200 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {formatNumber(stat.value)}
            <span className="text-lg text-gray-600 ml-1">{stat.unit}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}