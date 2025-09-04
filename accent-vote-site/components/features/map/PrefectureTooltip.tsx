'use client';

import React from 'react';
import { MapPin, Users, TrendingUp, Award } from 'lucide-react';
import { accentColors } from '@/lib/japanMapData';

interface VoteData {
  accentType: string;
  count: number;
  percentage: number;
}

interface PrefectureTooltipProps {
  prefecture: string;
  votes: VoteData[];
  totalVotes: number;
  position?: { x: number; y: number };
  visible?: boolean;
  className?: string;
}

const PrefectureTooltip: React.FC<PrefectureTooltipProps> = ({
  prefecture,
  votes,
  totalVotes,
  position = { x: 0, y: 0 },
  visible = false,
  className = ''
}) => {
  if (!visible || !votes || votes.length === 0) {
    return null;
  }

  // 投票数でソート（降順）
  const sortedVotes = [...votes].sort((a, b) => b.count - a.count);
  const topAccent = sortedVotes[0];

  return (
    <div
      className={`absolute z-50 bg-white rounded-lg shadow-xl border p-4 min-w-[280px] ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -110%)',
        pointerEvents: 'none'
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{prefecture}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{totalVotes.toLocaleString()}票</span>
        </div>
      </div>

      {/* 第1位のアクセント */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-muted-foreground">最多アクセント</span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded border border-gray-300"
            style={{ 
              backgroundColor: accentColors[topAccent.accentType as keyof typeof accentColors] || accentColors['データ不足']
            }}
          />
          <span className="font-medium text-sm">{topAccent.accentType}</span>
          <span className="ml-auto text-sm font-bold">{topAccent.percentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* 全アクセントタイプの分布 */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-1">投票分布</div>
        {sortedVotes.map((vote, index) => (
          <div key={vote.accentType} className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-muted-foreground w-4">
                {index + 1}.
              </span>
              <div 
                className="w-3 h-3 rounded-sm border border-gray-200"
                style={{ 
                  backgroundColor: accentColors[vote.accentType as keyof typeof accentColors] || accentColors['データ不足']
                }}
              />
              <span className="text-xs">{vote.accentType}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-100 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${vote.percentage}%`,
                    backgroundColor: accentColors[vote.accentType as keyof typeof accentColors] || accentColors['データ不足']
                  }}
                />
              </div>
              <span className="text-xs font-medium w-12 text-right">
                {vote.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="mt-3 pt-2 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            クリックして詳細を表示
          </span>
          <TrendingUp className="h-3 w-3 text-primary" />
        </div>
      </div>

      {/* 三角形の吹き出し矢印 */}
      <div 
        className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white',
        }}
      />
      <div 
        className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '9px solid #e5e7eb',
          zIndex: -1
        }}
      />
    </div>
  );
};

export default PrefectureTooltip;