'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download
} from 'lucide-react';
import { RankingItem } from '@/types/ranking';

interface RankingTableProps {
  items: RankingItem[];
  isLoading?: boolean;
  showRankChange?: boolean;
  onExport?: () => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  items,
  isLoading,
  showRankChange = false,
  onExport
}) => {
  const getRankChangeIcon = (item: RankingItem) => {
    if (!item.rankChange) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (item.rankChange > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+{item.rankChange}</span>
        </div>
      );
    } else if (item.rankChange < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{item.rankChange}</span>
        </div>
      );
    }
    
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-600';
    return 'bg-gray-200';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onExport && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSVエクスポート
          </Button>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-20 text-center">順位</TableHead>
              <TableHead>項目名</TableHead>
              <TableHead className="text-right">総投票数</TableHead>
              <TableHead className="text-right">投票者数</TableHead>
              <TableHead>最多投票</TableHead>
              {showRankChange && (
                <TableHead className="text-center">前回比</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow 
                key={item.wordId}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell className="text-center">
                  <Badge 
                    className={`${getRankBadgeColor(item.rank)} text-white`}
                  >
                    {item.rank}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Link 
                    href={`/words/${item.wordId}`}
                    className="hover:underline"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.headword}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.reading}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                
                <TableCell className="text-right">
                  <span className="font-medium">
                    {item.totalVotes.toLocaleString()}
                  </span>
                </TableCell>
                
                <TableCell className="text-right">
                  <span className="text-gray-600">
                    {item.uniqueVoters.toLocaleString()}
                  </span>
                </TableCell>
                
                <TableCell>
                  {item.mostVotedType ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {item.mostVotedType.name || item.mostVotedAccentType?.name || '未設定'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({(item.mostVotedType.votePercentage || item.mostVotedAccentType?.votePercentage || 0).toFixed(1)}%)
                      </span>
                    </div>
                  ) : item.mostVotedAccentType ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {item.mostVotedAccentType.name}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({item.mostVotedAccentType.votePercentage.toFixed(1)}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                
                {showRankChange && (
                  <TableCell className="text-center">
                    {getRankChangeIcon(item)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ランキングデータがありません
        </div>
      )}
    </div>
  );
};