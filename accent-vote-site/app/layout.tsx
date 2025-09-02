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
    default: '日本語アクセント投票サイト | 全国の発音を集めて共有',
    template: '%s | 日本語アクセント投票サイト',
  },
  description: '日本語の単語のアクセントパターンを地域別に調査・共有するプラットフォーム。全国各地の発音の違いを投票で明らかにし、日本語の多様性を可視化します。',
  keywords: ['日本語', 'アクセント', '方言', '投票', '地域差', '発音', '言語学', '日本語教育'],
  authors: [{ name: '日本語アクセント投票サイト運営チーム' }],
  creator: '日本語アクセント投票サイト',
  publisher: '日本語アクセント投票サイト',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: '日本語アクセント投票サイト',
    description: '全国の日本語アクセントパターンを調査・共有するプラットフォーム',
    url: 'https://accent-vote.jp',
    siteName: '日本語アクセント投票サイト',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '日本語アクセント投票サイト',
    description: '全国の日本語アクセントパターンを調査・共有',
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
  name: '日本語アクセント投票サイト',
  url: 'https://accent-vote.jp',
  description: '日本語の単語のアクセントパターンを地域別に調査・共有するプラットフォーム',
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
    name: '日本語アクセント投票サイト',
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
        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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