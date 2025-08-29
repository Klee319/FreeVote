'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useComparisonData } from '@/hooks/api/useRanking';
import { PREFECTURES } from '@/types/ranking';
import { Info, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PrefectureComparisonProps {
  basePrefecture: string;
  selectedPrefectures: string[];
  onPrefectureSelect: (prefectures: string[]) => void;
}

export const PrefectureComparison: React.FC<PrefectureComparisonProps> = ({
  basePrefecture,
  selectedPrefectures,
  onPrefectureSelect
}) => {
  // 比較対象の都道府県（基準を含む）
  const comparisonPrefectures = useMemo(
    () => [basePrefecture, ...selectedPrefectures],
    [basePrefecture, selectedPrefectures]
  );

  // 比較データ取得
  const { data, isLoading, error } = useComparisonData(comparisonPrefectures);

  const handlePrefectureToggle = (prefCode: string) => {
    if (selectedPrefectures.includes(prefCode)) {
      onPrefectureSelect(selectedPrefectures.filter(p => p !== prefCode));
    } else if (selectedPrefectures.length < 2) {
      onPrefectureSelect([...selectedPrefectures, prefCode]);
    }
  };

  const getPrefectureName = (code: string) => {
    return PREFECTURES.find(p => p.code === code)?.name || code;
  };

  const getAccentBadgeColor = (accentType: string) => {
    const colors: Record<string, string> = {
      'heiban': 'bg-blue-500',
      'atamadaka': 'bg-red-500',
      'nakadaka': 'bg-green-500',
      'odaka': 'bg-purple-500'
    };
    return colors[accentType] || 'bg-gray-500';
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          比較データの取得に失敗しました
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 都道府県選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">比較する都道府県を選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                最大2つまで追加で選択できます（基準: {getPrefectureName(basePrefecture)}）
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {PREFECTURES.filter(p => p.code !== basePrefecture).map(pref => (
              <label
                key={pref.code}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedPrefectures.includes(pref.code)}
                  onCheckedChange={() => handlePrefectureToggle(pref.code)}
                  disabled={
                    !selectedPrefectures.includes(pref.code) && 
                    selectedPrefectures.length >= 2
                  }
                />
                <span className="text-sm">{pref.name}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 比較結果表示 */}
      {selectedPrefectures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">比較結果</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* 比較テーブル */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white">語</TableHead>
                        {comparisonPrefectures.map(code => (
                          <TableHead key={code} className="text-center min-w-32">
                            {getPrefectureName(code)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.comparison.words.slice(0, 10).map(word => (
                        <TableRow key={word.wordId}>
                          <TableCell className="sticky left-0 bg-white font-medium">
                            <div>
                              <div>{word.headword}</div>
                              <div className="text-xs text-gray-500">
                                {word.reading}
                              </div>
                            </div>
                          </TableCell>
                          {comparisonPrefectures.map(prefCode => {
                            const ranking = word.rankings.find(
                              r => r.prefectureCode === prefCode
                            );
                            return (
                              <TableCell key={prefCode} className="text-center">
                                {ranking ? (
                                  <div className="space-y-1">
                                    <div className="font-bold">
                                      #{ranking.rank}
                                    </div>
                                    <Badge 
                                      className={`${getAccentBadgeColor(ranking.accentType)} text-white text-xs`}
                                    >
                                      {ranking.accentType}
                                    </Badge>
                                    <div className="text-xs text-gray-500">
                                      {ranking.voteCount}票
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* インサイト表示 */}
                {data.insights.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">分析結果</h3>
                    {data.insights.map((insight, index) => (
                      <Alert key={index}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {insight.message}
                          {insight.data && (
                            <div className="mt-2">
                              {insight.type === 'regional_difference' && (
                                <div className="flex flex-wrap gap-2">
                                  {insight.data.accents.map((accent: any, i: number) => (
                                    <Badge key={i} variant="outline">
                                      {accent.prefecture}: {accent.accent}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {insight.type === 'common_popular' && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {insight.data.words.join('、')}
                                </div>
                              )}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};