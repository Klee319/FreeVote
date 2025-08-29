'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { WordCategory } from '@/types';

interface RelatedWordsProps {
  currentWordId: number;
  category: WordCategory;
}

export function RelatedWords({ currentWordId, category }: RelatedWordsProps) {
  // カテゴリに基づいて関連語を取得
  const { data: relatedWords } = useQuery({
    queryKey: ['relatedWords', category, currentWordId],
    queryFn: async () => {
      const response = await api.searchWords({ category, limit: 6 });
      // 現在の語を除外
      return response.words.filter(w => w.id !== currentWordId).slice(0, 5);
    },
  });

  if (!relatedWords || relatedWords.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-bold text-lg mb-4">関連語</h3>
      <div className="space-y-3">
        {relatedWords.map((word) => (
          <Link
            key={word.id}
            href={`/words/${word.id}`}
            className="block hover:bg-gray-50 p-2 -mx-2 rounded transition-colors"
          >
            <div className="font-medium text-gray-900">
              {word.headword}
              <span className="ml-2 text-sm text-gray-500">({word.reading})</span>
            </div>
            {word.totalVotes !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                {word.totalVotes}票 • モーラ数: {word.moraCount}
              </div>
            )}
          </Link>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <Link
          href={`/search?category=${category}`}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          同じカテゴリの語を見る →
        </Link>
      </div>
    </div>
  );
}