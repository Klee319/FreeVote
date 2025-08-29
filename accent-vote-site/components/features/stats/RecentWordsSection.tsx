'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

export function RecentWordsSection() {
  const { data: recentWords, isLoading } = useQuery({
    queryKey: ['recentWords'],
    queryFn: () => api.getRecentWords(10),
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">新着語</h2>
        <span className="text-sm text-gray-500">最新の投稿語</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {recentWords?.map((word) => (
            <Link
              key={word.id}
              href={`/words/${word.id}`}
              className="block hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    {word.headword}
                    <span className="ml-2 text-sm text-gray-500">({word.reading})</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {word.createdAt && formatDate(word.createdAt).split(' ')[0]}
                    </span>
                    <span className="flex items-center">
                      モーラ数: {word.moraCount}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    word.category === 'general' ? 'bg-blue-100 text-blue-700' :
                    word.category === 'proper_noun' ? 'bg-green-100 text-green-700' :
                    word.category === 'technical' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {word.category === 'general' ? '一般語' :
                     word.category === 'proper_noun' ? '固有名詞' :
                     word.category === 'technical' ? '専門用語' :
                     '方言'}
                  </span>
                </div>
              </div>
              {word.totalVotes !== undefined && word.totalVotes > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  現在の投票数: {word.totalVotes}票
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/search?sort=recent"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          もっと見る →
        </Link>
      </div>
    </div>
  );
}