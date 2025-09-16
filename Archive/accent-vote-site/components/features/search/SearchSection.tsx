'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function SearchSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // サジェスト取得
  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', searchQuery],
    queryFn: () => api.getWordSuggestions(searchQuery),
    enabled: searchQuery.length > 0 && isFocused,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (wordId: number) => {
    router.push(`/words/${wordId}`);
    setSearchQuery('');
    setIsFocused(false);
  };

  const popularWords = ['桜', '富士山', '寿司', '東京', '花見'];

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="調べたい語を入力してください（例：桜、東京、寿司）"
            className="w-full px-6 py-4 pl-14 pr-6 text-lg border-2 border-gray-300 rounded-full focus:border-primary-500 focus:outline-none transition-colors"
          />
          <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
          >
            検索
          </button>
        </div>

        {/* サジェスト表示 */}
        {isFocused && suggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            {suggestions.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => handleSuggestionClick(word.id)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{word.headword}</span>
                    <span className="ml-2 text-gray-500">({word.reading})</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {word.totalVotes}票
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* 人気の検索語 */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <span className="text-sm text-gray-500">人気の検索:</span>
        {popularWords.map((word) => (
          <button
            key={word}
            onClick={() => {
              setSearchQuery(word);
              handleSearch(new Event('submit') as any);
            }}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}