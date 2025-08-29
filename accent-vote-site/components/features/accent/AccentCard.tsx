'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AccentOption, VoteStat } from '@/types';
import { AccentPattern } from './AccentPattern';
import { getAccentTypeName, formatNumber } from '@/lib/utils';

interface AccentCardProps {
  accentOption: AccentOption;
  moraSegments: string[];
  voteStats?: VoteStat;
  isSelected?: boolean;
  canVote?: boolean;
  onVote?: () => void;
  disabled?: boolean;
  showPattern?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AccentCard({
  accentOption,
  moraSegments,
  voteStats,
  isSelected = false,
  canVote = true,
  onVote,
  disabled = false,
  showPattern = true,
  size = 'md',
}: AccentCardProps) {
  const handleClick = () => {
    if (!disabled && canVote && onVote) {
      onVote();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      className={cn(
        'bg-white rounded-lg border-2 p-4 cursor-pointer transition-all',
        isSelected && 'border-primary-500 bg-primary-50',
        !isSelected && 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !isSelected && 'hover:shadow-md'
      )}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`${getAccentTypeName(accentOption.accentType.code)}に投票`}
    >
      {/* アクセント型名 */}
      <div className="text-center mb-3">
        <h3 className={cn(
          'font-bold',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl'
        )}>
          {getAccentTypeName(accentOption.accentType.code)}
        </h3>
        
        {voteStats && (
          <div className="mt-1 space-y-1">
            <div className="text-sm text-gray-600">
              {formatNumber(voteStats.count)}票
            </div>
            <div className="flex items-center justify-center">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    isSelected ? 'bg-primary-600' : 'bg-gray-400'
                  )}
                  style={{ width: `${voteStats.percentage}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {voteStats.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* アクセントパターン表示 */}
      {showPattern && (
        <AccentPattern
          pattern={accentOption.pattern}
          moraSegments={moraSegments}
          dropPosition={accentOption.dropPosition}
          size={size}
          animated={isSelected}
        />
      )}

      {/* 投票ボタン */}
      {canVote && (
        <div className="mt-4 text-center">
          <button
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {isSelected ? '投票済み' : '投票する'}
          </button>
        </div>
      )}
    </motion.div>
  );
}