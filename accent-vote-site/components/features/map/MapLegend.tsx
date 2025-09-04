'use client';

import React from 'react';
import { accentColors } from '@/lib/japanMapData';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapLegendProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  className = '', 
  showTitle = true,
  compact = false 
}) => {
  const accentTypeDescriptions = {
    '頭高型': '第1拍が高く、第2拍以降が低くなるアクセント',
    '平板型': '第1拍が低く、第2拍以降が高く平坦に続くアクセント',
    '中高型': '語中に高い部分があるアクセント',
    '尾高型': '最後の拍が高くなるアクセント',
    'データ不足': '投票データが不足している地域'
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {Object.entries(accentColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-3 ${className}`}>
        {showTitle && (
          <h3 className="text-sm font-semibold flex items-center gap-1">
            アクセントタイプ凡例
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  各都道府県で最も投票数が多いアクセントタイプを色で表示しています
                </p>
              </TooltipContent>
            </Tooltip>
          </h3>
        )}
        
        <div className="space-y-2">
          {Object.entries(accentColors).map(([type, color]) => (
            <div key={type} className="flex items-start gap-3">
              <div className="flex items-center gap-2 min-w-[100px]">
                <div 
                  className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium">{type}</span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-left group">
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {accentTypeDescriptions[type as keyof typeof accentTypeDescriptions]}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    {type === 'データ不足' 
                      ? '投票データがまだ集まっていない地域です。ぜひ投票にご参加ください！'
                      : `${type}の詳細な説明と音声例は投票ページでご確認いただけます`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              色の濃淡は投票率の高さを表しています。
              都道府県をクリックすると詳細な統計情報を確認できます。
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MapLegend;