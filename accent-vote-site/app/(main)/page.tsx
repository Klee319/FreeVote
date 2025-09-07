import { SearchSection } from '@/components/features/search/SearchSection';
import { RankingSection } from '@/components/features/stats/RankingSection';
import { RecentPollsSection } from '@/components/features/stats/RecentPollsSection';
import { StatisticsSummary } from '@/components/features/stats/StatisticsSummary';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="text-primary-600">気になる投票所</span>へようこそ
            </h1>
            <p className="text-lg font-semibold text-gray-600 max-w-2xl mx-auto">
              日本語のアクセントから身近な疑問まで、みんなで投票して答えを見つける投票プラットフォーム
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
            
            {/* Recent Polls */}
            <RecentPollsSection />
          </div>
        </div>
      </section>
    </div>
  );
}