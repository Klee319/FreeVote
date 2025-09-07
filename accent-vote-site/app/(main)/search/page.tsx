'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useState, Suspense } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  const { data, isLoading } = useQuery({
    queryKey: ['search', currentQuery],
    queryFn: () => api.searchWords({ q: currentQuery }),
    enabled: currentQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentQuery(searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">語を検索</h1>

      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="調べたい語を入力..."
            className="w-full px-4 py-3 pl-12 pr-4 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            検索
          </button>
        </div>
      </form>

      {/* 検索結果 */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      ) : data && data.words.length > 0 ? (
        <div>
          <p className="text-gray-600 mb-4">
            「{currentQuery}」の検索結果: {data.totalCount}件
          </p>
          <div className="space-y-4">
            {data.words.map((word) => (
              <Link
                key={word.id}
                href={`/words/${word.id}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {word.headword}
                      <span className="ml-2 text-gray-500">({word.reading})</span>
                    </h3>
                    <div className="mt-1 text-sm text-gray-600">
                      モーラ数: {word.moraCount} • カテゴリ: 
                      {word.category === 'general' ? ' 一般語' :
                       word.category === 'proper_noun' ? ' 固有名詞' :
                       word.category === 'technical' ? ' 専門用語' : ' 方言'}
                    </div>
                  </div>
                  {word.totalVotes !== undefined && (
                    <div className="text-sm text-gray-500">
                      {word.totalVotes}票
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : currentQuery ? (
        <div className="text-center py-12">
          <p className="text-gray-600">「{currentQuery}」に該当する語が見つかりませんでした。</p>
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>検索ページを読み込み中...</div>}>
      <SearchContent />
    </Suspense>
  );
}