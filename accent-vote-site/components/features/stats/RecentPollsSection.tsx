'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

export function RecentPollsSection() {
  const { data: recentPolls, isLoading } = useQuery({
    queryKey: ['recentPolls'],
    queryFn: () => api.getRecentPolls(10),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      return `${diffInMinutes}分前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else if (diffInDays < 7) {
      return `${diffInDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">新着投票</h2>
        <ClockIcon className="w-5 h-5 text-gray-400" />
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
          {recentPolls?.slice(0, 10).map((poll) => (
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">
                    {poll.title}
                  </div>
                  {poll.description && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {poll.description}
                    </div>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                    <span>{formatDate(poll.createdAt)}</span>
                    {poll.voteCount !== undefined && (
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="w-3 h-3" />
                        <span>{formatNumber(poll.voteCount)}票</span>
                      </div>
                    )}
                  </div>
                </div>
                {poll.deadline && new Date(poll.deadline) > new Date() && (
                  <div className="ml-3 text-right">
                    <div className="text-xs text-orange-600 font-medium">
                      締切間近
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(poll.deadline).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}まで
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/polls"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          すべての投票を見る →
        </Link>
      </div>
    </div>
  );
}