import { SearchSection } from '@/components/features/search/SearchSection';
import { RankingSection } from '@/components/features/stats/RankingSection';
import { RecentWordsSection } from '@/components/features/stats/RecentWordsSection';
import { StatisticsSummary } from '@/components/features/stats/StatisticsSummary';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              日本語の<span className="text-primary-600">アクセント</span>を調べよう
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              全国のユーザーが投票した日本語のアクセントパターンを調査・共有するプラットフォーム
            </p>
          </div>
          
          {/* Search Section */}
          <SearchSection />
          
          {/* Statistics Summary */}
          <StatisticsSummary />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Rankings */}
            <RankingSection />
            
            {/* Recent Words */}
            <RecentWordsSection />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            あなたの地域のアクセントを教えてください
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            日本各地のアクセントの違いを記録することで、日本語の多様性を保存し、
            研究や教育に活用できるデータベースを作成しています。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/search"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              語を検索して投票する
            </a>
            <a
              href="/submit"
              className="px-6 py-3 bg-white text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              新しい語を投稿する
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}