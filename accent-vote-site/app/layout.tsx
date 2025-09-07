import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: '気になる投票所 | みんなで作る投票プラットフォーム',
    template: '%s | 気になる投票所',
  },
  description: 'みんなで作る投票プラットフォーム。様々なテーマについて投票を行い、意見や傾向を可視化します。',
  keywords: ['日本語', 'アクセント', '方言', '投票', '地域差', '発音', '言語学', '日本語教育'],
  authors: [{ name: '気になる投票所運営チーム' }],
  creator: '気になる投票所',
  publisher: '気になる投票所',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: '気になる投票所',
    description: 'みんなで作る投票プラットフォーム - 様々なテーマについて投票できます',
    url: 'https://accent-vote.jp',
    siteName: '気になる投票所',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '気になる投票所',
    description: 'みんなで作る投票プラットフォーム',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
  other: {
    'preconnect': [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
  },
};

// Viewport設定を独立したexportとして定義
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Structured Data (JSON-LD)
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '気になる投票所',
  url: 'https://accent-vote.jp',
  description: 'みんなで作る投票プラットフォーム - 日本語アクセントから様々なテーマまで',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://accent-vote.jp/search?q={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: '気になる投票所',
    url: 'https://accent-vote.jp'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* Structured Data - Placed in head for better SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={`${inter.className} font-japanese`}>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツへスキップ
        </a>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              // アクセシビリティ: スクリーンリーダー対応
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}