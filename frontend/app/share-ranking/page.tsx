'use client';

import React, { useState, useEffect } from 'react';
import { ShareIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface UserRanking {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  shareCount: number;
  mostSharedPoll?: string;
  joinedDate: string;
  trend: 'up' | 'down' | 'same';
  previousRank?: number;
}

// ダミーデータ（実際にはAPIから取得）
const dummyRankings: UserRanking[] = [
  {
    rank: 1,
    userId: '1',
    username: 'ShareMaster2025',
    avatar: '/api/placeholder/40/40',
    shareCount: 1247,
    mostSharedPoll: '2025年最も期待される技術は？',
    joinedDate: '2024-12-01',
    trend: 'up',
    previousRank: 2
  },
  {
    rank: 2,
    userId: '2',
    username: 'VoteExplorer',
    avatar: '/api/placeholder/40/40',
    shareCount: 989,
    mostSharedPoll: '好きなプログラミング言語は？',
    joinedDate: '2024-11-15',
    trend: 'down',
    previousRank: 1
  },
  {
    rank: 3,
    userId: '3',
    username: 'PollEnthusiast',
    avatar: '/api/placeholder/40/40',
    shareCount: 756,
    mostSharedPoll: '働き方改革で最も重要なことは？',
    joinedDate: '2025-01-05',
    trend: 'up',
    previousRank: 5
  },
  {
    rank: 4,
    userId: '4',
    username: 'TrendSetter',
    avatar: '/api/placeholder/40/40',
    shareCount: 623,
    mostSharedPoll: '2025年のトレンド予想',
    joinedDate: '2024-10-20',
    trend: 'same',
    previousRank: 4
  },
  {
    rank: 5,
    userId: '5',
    username: 'DataLover',
    avatar: '/api/placeholder/40/40',
    shareCount: 512,
    mostSharedPoll: 'AIの未来について',
    joinedDate: '2024-12-10',
    trend: 'down',
    previousRank: 3
  },
  {
    rank: 6,
    userId: '6',
    username: 'OpinionLeader',
    shareCount: 487,
    mostSharedPoll: '環境問題への取り組み',
    joinedDate: '2025-01-01',
    trend: 'up',
    previousRank: 8
  },
  {
    rank: 7,
    userId: '7',
    username: 'CommunityBuilder',
    shareCount: 432,
    mostSharedPoll: 'コミュニティの重要性',
    joinedDate: '2024-09-15',
    trend: 'up',
    previousRank: 9
  },
  {
    rank: 8,
    userId: '8',
    username: 'InsightfulVoter',
    shareCount: 398,
    mostSharedPoll: 'リモートワークの未来',
    joinedDate: '2024-11-01',
    trend: 'down',
    previousRank: 6
  },
  {
    rank: 9,
    userId: '9',
    username: 'ActiveParticipant',
    shareCount: 365,
    mostSharedPoll: '健康的な生活習慣',
    joinedDate: '2024-12-20',
    trend: 'same',
    previousRank: 9
  },
  {
    rank: 10,
    userId: '10',
    username: 'NewComer2025',
    shareCount: 298,
    mostSharedPoll: '新年の抱負',
    joinedDate: '2025-01-10',
    trend: 'up',
    previousRank: 15
  }
];

export default function ShareRankingPage() {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // APIから実際のランキングデータを取得
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // 実際のAPI呼び出しはここに実装
        // const response = await fetch(`/api/rankings?period=${selectedPeriod}`);
        // const data = await response.json();
        // setRankings(data);

        // ダミーデータを使用
        setTimeout(() => {
          setRankings(dummyRankings);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedPeriod]);

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

  const getTrendIcon = (trend: 'up' | 'down' | 'same', previousRank?: number, currentRank?: number) => {
    if (trend === 'up' && previousRank && currentRank) {
      const diff = previousRank - currentRank;
      return (
        <span className="text-green-500 flex items-center text-sm">
          ▲ {diff > 0 ? `+${diff}` : ''}
        </span>
      );
    } else if (trend === 'down' && previousRank && currentRank) {
      const diff = currentRank - previousRank;
      return (
        <span className="text-red-500 flex items-center text-sm">
          ▼ {diff > 0 ? `-${diff}` : ''}
        </span>
      );
    }
    return <span className="text-gray-400 text-sm">－</span>;
  };

  const periodButtons = [
    { value: 'daily' as const, label: '今日' },
    { value: 'weekly' as const, label: '今週' },
    { value: 'monthly' as const, label: '今月' },
    { value: 'all' as const, label: '全期間' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <TrophyIcon className="w-12 h-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              シェアランキング
            </h1>
          </div>
          <p className="text-gray-600 mb-6">
            投票をシェアして、みんなに広めよう！
          </p>

          {/* 期間選択ボタン */}
          <div className="flex justify-center gap-2 flex-wrap">
            {periodButtons.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* ランキングリスト */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* トップ3の特別表示 */}
            {rankings.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {rankings.slice(0, 3).map((user) => (
                  <div
                    key={user.userId}
                    className={`bg-white rounded-2xl shadow-lg border ${
                      user.rank === 1 ? 'border-yellow-400' : user.rank === 2 ? 'border-gray-400' : 'border-orange-400'
                    } p-6 text-center transform hover:scale-105 transition-transform duration-200`}
                  >
                    <div className="text-4xl mb-2">{getRankIcon(user.rank)}</div>
                    <div className="relative inline-block mb-3">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          width={60}
                          height={60}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-15 h-15 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {user.rank === 1 && (
                        <FireIcon className="absolute -top-2 -right-2 w-6 h-6 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{user.username}</h3>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {user.shareCount.toLocaleString()}人シェア
                    </div>
                    <div className="text-xs text-gray-500">
                      最多シェア: {user.mostSharedPoll}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4位以降の表示 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {rankings.slice(3).map((user) => (
                  <div
                    key={user.userId}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-700 w-10">
                            {user.rank}
                          </span>
                          {getTrendIcon(user.trend, user.previousRank, user.rank)}
                        </div>
                        <div className="flex items-center space-x-3">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.username}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{user.username}</p>
                            <p className="text-sm text-gray-500">
                              参加日: {new Date(user.joinedDate).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <ShareIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-xl font-bold text-blue-600">
                            {user.shareCount.toLocaleString()}人シェア
                          </span>
                        </div>
                        {user.mostSharedPoll && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            最多: {user.mostSharedPoll}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 参加促進セクション */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <ShareIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">あなたもランキングに参加しよう！</h3>
          <p className="mb-6">
            投票結果をシェアして、より多くの人に意見を届けましょう。<br />
            シェア数が増えると、ランキング上位に表示されます。
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            投票を見る
          </button>
        </div>
      </div>
    </div>
  );
}