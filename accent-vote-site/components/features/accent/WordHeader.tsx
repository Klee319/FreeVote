'use client';

import { WordDetail } from '@/types';
import { SpeakerWaveIcon, BookmarkIcon, FlagIcon } from '@heroicons/react/24/outline';

interface WordHeaderProps {
  word: WordDetail;
}

export function WordHeader({ word }: WordHeaderProps) {
  const handlePlayAudio = () => {
    // 音声再生機能（実装予定）
    console.log('Playing audio for:', word.reading);
  };

  const handleBookmark = () => {
    // ブックマーク機能（実装予定）
    console.log('Bookmarking:', word.id);
  };

  const handleReport = () => {
    // 報告機能（実装予定）
    console.log('Reporting:', word.id);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {word.headword}
            <span className="ml-3 text-xl text-gray-600">（{word.reading}）</span>
          </h1>
          
          {word.aliases && word.aliases.length > 0 && (
            <div className="text-sm text-gray-500 mb-3">
              別表記: {word.aliases.join('、')}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              モーラ数: {word.moraCount}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {word.category === 'general' ? '一般語' :
               word.category === 'proper_noun' ? '固有名詞' :
               word.category === 'technical' ? '専門用語' : '方言'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handlePlayAudio}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="音声を再生"
          >
            <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleBookmark}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ブックマーク"
          >
            <BookmarkIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleReport}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="問題を報告"
          >
            <FlagIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* モーラ分割表示 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">モーラ分割:</div>
        <div className="flex items-center space-x-2">
          {word.moraSegments.map((mora, index) => (
            <span key={index} className="text-lg font-medium">
              {mora}
              {index < word.moraSegments.length - 1 && (
                <span className="text-gray-400 mx-1">・</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}