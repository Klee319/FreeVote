'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getAccentTypeName, getAccentTypeColor, formatNumber } from '@/lib/utils';
import { ChevronUpIcon, ChevronDownIcon, MinusIcon } from '@heroicons/react/24/outline';

export function RankingSection() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['rankings', period],
    queryFn: () => api.getRanking(period),
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return <MinusIcon className="w-4 h-4 text-gray-400" />;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ChevronUpIcon className="w-4 h-4" />
          <span className="text-xs">{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-red-600">
        <ChevronDownIcon className="w-4 h-4" />
        <span className="text-xs">{Math.abs(change)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">人気ランキング</h2>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'daily' ? '日間' : p === 'weekly' ? '週間' : '月間'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rankings?.map((word) => (
            <Link
              key={word.id}
              href={`/words/${word.id}`}
              className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-700 w-8">
                      {getRankIcon(word.rank) || word.rank}
                    </span>
                    {getChangeIcon(word.changeFromLastWeek)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {word.headword}
                      <span className="ml-2 text-sm text-gray-500">({word.reading})</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(word.totalVotes)}票 ・ {word.prefectureCount}県
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-medium"
                    style={{ color: getAccentTypeColor(word.dominantAccent) }}
                  >
                    {getAccentTypeName(word.dominantAccent)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {word.dominantAccentPercentage}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/ranking"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          すべて見る →
        </Link>
      </div>
    </div>
  );
}