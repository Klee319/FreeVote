'use client';

import { RankingTabs } from '@/components/features/ranking/RankingTabs';

export default function RankingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          アクセントランキング
        </h1>
        <p className="text-gray-600">
          全国のユーザーが投票した語の人気ランキングです。地域・年代・性別ごとの傾向を確認できます。
        </p>
      </div>

      <RankingTabs />
    </div>
  );
}