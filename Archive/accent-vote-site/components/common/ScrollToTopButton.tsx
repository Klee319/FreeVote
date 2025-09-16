'use client';

import React from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * ページの先頭へスクロールするボタンコンポーネント
 */
const ScrollToTopButton: React.FC = () => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <button
        onClick={handleScrollToTop}
        className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
        aria-label="ページの先頭へ戻る"
      >
        <ChevronUp className="w-5 h-5 mr-2" aria-hidden="true" />
        ページトップへ
      </button>
    </div>
  );
};

export default ScrollToTopButton;