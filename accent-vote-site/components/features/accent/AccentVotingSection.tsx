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
  selectedPrefecture: string;
  onPrefectureChange: (prefecture: string) => void;
}

export function AccentVotingSection({
  word,
  accentOptions,
  nationalStats,
  canVote,
  onVote,
  isVoting = false,
  selectedPrefecture,
  onPrefectureChange,
}: AccentVotingSectionProps) {
  // 統計データをアクセントオプションにマッピング
  const getVoteStats = (accentType: string) => {
    const stat = nationalStats?.find(s => {
      // APIから返されるデータの形式に対応 - AccentStatのaccentTypeはAccentType型
      return s.accentType === accentType;
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
        
        {/* 都道府県選択 */}
        <div className="mt-4 flex items-center space-x-4">
          <label htmlFor="prefecture" className="text-sm font-medium text-gray-700">
            あなたの地域:
          </label>
          <select
            id="prefecture"
            value={selectedPrefecture}
            onChange={(e) => onPrefectureChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          >
            {Object.entries(PREFECTURE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {!canVote && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              この語には既に投票済みです。24時間後に再度投票できます。
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
              voteStats={voteStats}
              isSelected={word.userVote?.accentType === option.accentType.code}
              canVote={canVote}
              onVote={() => onVote(option.accentTypeId!)}
              disabled={!canVote || isVoting}
              showPattern={true}
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