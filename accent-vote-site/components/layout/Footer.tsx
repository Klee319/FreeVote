import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    サービス: [
      { href: '/about', label: 'このサイトについて', available: false },
      { href: '/guide', label: '使い方ガイド', available: true },
      { href: '/faq', label: 'よくある質問', available: false },
    ],
    法的情報: [
      { href: '/privacy', label: 'プライバシーポリシー', available: true },
      { href: '/terms', label: '利用規約', available: true },
      { href: '/contact', label: 'お問い合わせ', available: false },
    ],
  };

  return (
    <footer className="mt-auto bg-gray-50 border-t" role="contentinfo" aria-label="サイトフッター">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ロゴと説明 */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg font-bold text-primary-600">日本語</span>
              <span className="text-base">アクセント</span>
            </div>
            <p className="text-xs text-gray-600">
              日本語のアクセントパターンを全国から収集・共有するプラットフォーム
            </p>
          </div>

          {/* リンクセクション */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm" id={`footer-${title}`}>
                {title}
              </h3>
              <nav aria-labelledby={`footer-${title}`}>
                <ul className="space-y-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      {link.available ? (
                        <Link
                          href={link.href}
                          className="text-xs text-gray-600 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
                          aria-label={link.label}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span 
                          className="text-xs text-gray-400 cursor-not-allowed"
                          title="準備中"
                          aria-label={`${link.label} (準備中)`}
                        >
                          {link.label}
                          <span className="text-xs ml-1">(準備中)</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-3 border-t text-center">
          <p className="text-xs text-gray-500">
            <span aria-label="著作権">©</span> {currentYear} 日本語アクセント投票サイト. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}