import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { href: '/guide', label: '使い方ガイド', available: true },
    { href: '/terms', label: '利用規約', available: true },
    { href: '/privacy', label: 'プライバシーポリシー', available: true },
    { href: '/about', label: 'このサイトについて', available: false },
    { href: '/faq', label: 'よくある質問', available: false },
    { href: '/contact', label: 'お問い合わせ', available: false },
  ];

  return (
    <footer className="mt-auto bg-gray-50 border-t" role="contentinfo" aria-label="サイトフッター">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* 左側: ロゴとコピーライト */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-1">
              <span className="text-base font-bold text-primary-600">気になる</span>
              <span className="text-sm font-bold">投票所</span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              © {currentYear} All rights reserved.
            </p>
          </div>

          {/* 中央: リンク */}
          <nav aria-label="フッターナビゲーション">
            <ul className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
              {footerLinks.map((link, index) => (
                <li key={link.href} className="flex items-center">
                  {link.available ? (
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded px-1"
                      aria-label={link.label}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span 
                      className="text-gray-400 cursor-not-allowed"
                      title="準備中"
                      aria-label={`${link.label} (準備中)`}
                    >
                      {link.label}
                    </span>
                  )}
                  {index < footerLinks.length - 1 && (
                    <span className="ml-2 text-gray-300" aria-hidden="true">|</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* 右側: アクセシビリティ情報 (デスクトップのみ) */}
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400">
              WCAG 2.1 AA準拠
            </p>
          </div>
        </div>

        {/* モバイル用コピーライト */}
        <div className="sm:hidden mt-2 text-center">
          <p className="text-xs text-gray-500">
            © {currentYear} 気になる投票所
          </p>
        </div>
      </div>
    </footer>
  );
}