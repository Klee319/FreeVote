import { Metadata } from 'next';
import Link from 'next/link';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';

export const metadata: Metadata = {
  title: 'サイトマップ | 日本語アクセント投票サイト',
  description: '日本語アクセント投票サイトの全ページ一覧です。お探しのページを見つけやすくするためのサイトマップです。',
};

export default function SitemapPage() {
  const siteStructure: {
    title: string;
    pages: Array<{
      href: string;
      label: string;
      description: string;
      available?: boolean;
      restricted?: boolean;
    }>;
  }[] = [
    {
      title: 'メイン',
      pages: [
        { href: '/', label: 'トップページ', description: 'サイトのホームページ' },
        { href: '/search', label: '単語検索', description: '投票したい単語を検索' },
        { href: '/ranking', label: 'ランキング', description: '人気の単語ランキング' },
        { href: '/submit', label: '単語を提案', description: '新しい単語を提案' },
      ],
    },
    {
      title: '情報ページ',
      pages: [
        { href: '/guide', label: '使い方ガイド', description: 'サイトの使い方を詳しく説明' },
        { href: '/about', label: 'このサイトについて', description: 'サイトの目的と運営について', available: false },
        { href: '/faq', label: 'よくある質問', description: 'よくある質問と回答', available: false },
      ],
    },
    {
      title: '法的情報',
      pages: [
        { href: '/terms', label: '利用規約', description: 'サービス利用の条件' },
        { href: '/privacy', label: 'プライバシーポリシー', description: '個人情報の取り扱い' },
        { href: '/contact', label: 'お問い合わせ', description: 'お問い合わせフォーム', available: false },
      ],
    },
    {
      title: '研究・データ',
      pages: [
        { href: '/research', label: '研究プロジェクト', description: '関連する研究プロジェクト', available: false },
        { href: '/partners', label: '提携大学', description: '協力大学・研究機関', available: false },
        { href: '/data-usage', label: 'データ利用について', description: 'データの利用方法と制限', available: false },
      ],
    },
    {
      title: '管理者向け',
      pages: [
        { href: '/admin', label: '管理者ダッシュボード', description: '管理者専用ページ', restricted: true },
      ],
    },
  ];

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ブレッドクラム */}
      <nav aria-label="パンくずリスト" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link 
              href="/" 
              className="hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              ホーム
            </Link>
          </li>
          <li>
            <span className="mx-2" aria-hidden="true">/</span>
          </li>
          <li aria-current="page" className="text-gray-900 font-medium">
            サイトマップ
          </li>
        </ol>
      </nav>

      <article>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">サイトマップ</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8" role="note">
          <p className="text-gray-700">
            このページでは、日本語アクセント投票サイトの全ページを一覧でご確認いただけます。
            お探しのページをクリックしてアクセスしてください。
          </p>
        </div>

        {/* サイト構造 */}
        <div className="space-y-8">
          {siteStructure.map((section) => (
            <section key={section.title} className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                {section.title === 'メイン' && (
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {section.title === '情報ページ' && (
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {section.title === '法的情報' && (
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {section.title === '研究・データ' && (
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
                {section.title === '管理者向け' && (
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {section.title}
              </h2>
              
              <ul className="space-y-3" role="list">
                {section.pages.map((page) => (
                  <li key={page.href} className="flex items-start">
                    <span className="text-gray-400 mr-2" aria-hidden="true">•</span>
                    <div className="flex-1">
                      {page.available === false ? (
                        <div>
                          <span className="text-gray-400">
                            {page.label}
                            <span className="text-xs ml-2 bg-gray-100 px-2 py-1 rounded">準備中</span>
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                        </div>
                      ) : page.restricted ? (
                        <div>
                          <span className="text-gray-600">
                            {page.label}
                            <span className="text-xs ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              管理者限定
                            </span>
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                        </div>
                      ) : (
                        <div>
                          <Link 
                            href={page.href}
                            className="text-primary-600 hover:text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                          >
                            {page.label}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">{page.description}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* アクセシビリティ情報 */}
        <section className="mt-8 p-6 bg-green-50 rounded-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            アクセシビリティへの取り組み
          </h2>
          <p className="text-gray-700 mb-3">
            当サイトは、すべての方が快適にご利用いただけるよう、WCAG 2.1 レベルAAに準拠したアクセシビリティ対応を行っています。
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>キーボードのみでの操作に対応</li>
            <li>スクリーンリーダーでの読み上げに対応</li>
            <li>十分なコントラスト比の確保</li>
            <li>フォーカスインジケーターの明確化</li>
            <li>適切な見出し構造の実装</li>
          </ul>
        </section>

        {/* ページトップへ戻るボタン */}
        <ScrollToTopButton />
      </article>
    </main>
  );
}