'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number;
  unit: string;
  icon: string;
}

export function StatisticsSummary() {
  const [stats, setStats] = useState<StatItem[]>([
    { label: '総語数', value: 0, unit: '語', icon: '📚' },
    { label: '総投票数', value: 0, unit: '票', icon: '🗳️' },
    { label: '参加県数', value: 0, unit: '県', icon: '🗾' },
    { label: '今日の投票', value: 0, unit: '票', icon: '📊' },
  ]);

  useEffect(() => {
    // アニメーション効果でカウントアップ
    const targetStats = [
      { label: '総語数', value: 1234, unit: '語', icon: '📚' },
      { label: '総投票数', value: 12345, unit: '票', icon: '🗳️' },
      { label: '参加県数', value: 47, unit: '県', icon: '🗾' },
      { label: '今日の投票', value: 123, unit: '票', icon: '📊' },
    ];

    const duration = 1000;
    const steps = 20;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setStats(
        targetStats.map((target, index) => ({
          ...target,
          value: Math.floor(target.value * progress),
        }))
      );

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
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