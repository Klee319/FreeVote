import React from 'react';
import Link from 'next/link';

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated?: string;
  breadcrumbLabel: string;
}

/**
 * 法的文書ページ用の共通レイアウトコンポーネント
 * WCAG 2.1 AA準拠のアクセシビリティ対応
 */
export function LegalPageLayout({
  children,
  title,
  lastUpdated,
  breadcrumbLabel,
}: LegalPageLayoutProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ブレッドクラム - WCAG 2.1 AA準拠 */}
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
            {breadcrumbLabel}
          </li>
        </ol>
      </nav>

      {/* メインコンテンツ */}
      <article className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        
        {lastUpdated && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8" role="note">
            <p className="text-sm text-gray-700">
              最終更新日: {lastUpdated}
            </p>
          </div>
        )}

        {children}

        {/* ページトップへ戻るボタン - アクセシビリティ対応 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={handleScrollToTop}
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            aria-label="ページの先頭へ戻る"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            ページトップへ
          </button>
        </div>
      </article>
    </main>
  );
}

/**
 * スキップリンクコンポーネント
 * キーボードナビゲーション用（WCAG 2.1 AA準拠）
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
    >
      メインコンテンツへスキップ
    </a>
  );
}

/**
 * 見出しレベルを適切に設定するためのコンポーネント
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function Heading({ level, id, className = '', children }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const defaultClasses = {
    1: 'text-3xl font-bold text-gray-900 mb-4',
    2: 'text-2xl font-bold text-gray-900 mb-4',
    3: 'text-xl font-semibold text-gray-800 mb-3',
    4: 'text-lg font-semibold text-gray-800 mb-2',
    5: 'text-base font-medium text-gray-700 mb-2',
    6: 'text-sm font-medium text-gray-700 mb-1',
  };

  return (
    <Tag id={id} className={className || defaultClasses[level]}>
      {children}
    </Tag>
  );
}

/**
 * アクセシブルなアラートコンポーネント
 */
interface AlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
  role?: 'note' | 'alert' | 'status';
}

export function Alert({ type, children, role = 'note' }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-l-4 border-blue-400',
    warning: 'bg-yellow-50 border-l-4 border-yellow-400',
    error: 'bg-red-50 border-l-4 border-red-400',
    success: 'bg-green-50 border-l-4 border-green-400',
  };

  return (
    <div className={`${styles[type]} p-4 mb-4`} role={role}>
      {children}
    </div>
  );
}

/**
 * フォーカス可能な詳細開示コンポーネント
 */
interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ summary, children, defaultOpen = false }: DisclosureProps) {
  return (
    <details 
      className="bg-gray-50 p-4 rounded-lg mb-4 focus-within:ring-2 focus-within:ring-primary-500"
      open={defaultOpen}
    >
      <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600 focus:outline-none focus:text-primary-600">
        {summary}
      </summary>
      <div className="mt-3 text-gray-700">
        {children}
      </div>
    </details>
  );
}