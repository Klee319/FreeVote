'use client';

import { WordDetail, AccentOption, AccentStat } from '@/types';
import { AccentCard } from './AccentCard';
import { PREFECTURE_NAMES } from '@/lib/utils';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface AccentVotingSectionProps {
  word: WordDetail;
  accentOptions: AccentOption[];
  nationalStats: AccentStat[];
  canVote: boolean;
  onVote: (accentTypeId: number) => void;
  isVoting?: boolean;
  hasVoted?: boolean;
  onViewStats?: () => void;
}

export function AccentVotingSection({
  word,
  accentOptions,
  nationalStats,
  canVote,
  onVote,
  isVoting = false,
  hasVoted = false,
  onViewStats,
}: AccentVotingSectionProps) {
  // 統計データをアクセントオプションにマッピング
  const getVoteStats = (accentType: string) => {
    const stat = nationalStats?.find(s => {
      // APIから返されるデータの形式に対応
      // accentTypeがオブジェクトの場合はcodeプロパティと比較
      const statAccentType = typeof s.accentType === 'object' && s.accentType !== null
        ? (s.accentType as any).code
        : s.accentType;
      return statAccentType === accentType;
    });
    
    if (!stat) return { count: 0, percentage: 0 };
    
    // AccentStatの型定義に合わせてcountとpercentageを使用
    return { 
      count: stat.count || 0, 
      percentage: stat.percentage || 0 
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          「{word.headword}」のアクセントはどれですか？
        </h2>

        {!canVote && hasVoted && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-green-50 rounded-lg flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-800">
                投票ありがとうございました！
              </p>
            </div>
            {onViewStats && (
              <button
                onClick={onViewStats}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>統計を確認する</span>
              </button>
            )}
          </div>
        )}
        
        {!canVote && !hasVoted && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              この語には既に投票済みです。他の語への投票をお願いします。
            </p>
          </div>
        )}
        
        {isVoting && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
            <p className="text-sm text-blue-800">
              投票を処理中です...
            </p>
          </div>
        )}
      </div>

      {/* アクセントカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accentOptions.map((option) => {
          const voteStats = getVoteStats(option.accentType.code);
          return (
            <AccentCard
              key={option.id}
              accentOption={option}
              moraSegments={word.moraSegments}
              word={word.headword}
              reading={word.reading}
              voteStats={voteStats}
              isSelected={word.userVote?.accentType === option.accentType.code}
              canVote={canVote}
              onVote={() => onVote(option.accentTypeId!)}
              disabled={!canVote || isVoting}
              showPattern={true}
              showSpeechPlayer={true}
              size="md"
            />
          );
        })}
      </div>

      {/* アクセント型の説明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">アクセント型の説明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">頭高型:</span>
            <span className="ml-2 text-gray-600">最初が高く、後は低い</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">平板型:</span>
            <span className="ml-2 text-gray-600">2音目以降が平坦に高い</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">中高型:</span>
            <span className="ml-2 text-gray-600">途中に高い部分がある</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">尾高型:</span>
            <span className="ml-2 text-gray-600">語末が高く、助詞で下がる</span>
          </div>
        </div>
      </div>
    </div>
  );
}