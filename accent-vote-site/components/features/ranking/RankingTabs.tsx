'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RankingTable } from './RankingTable';
import { PrefectureComparison } from './PrefectureComparison';
import { useRanking, exportRankingCSV } from '@/hooks/api/useRanking';
import { RankingTabType, RankingFilters, PREFECTURES } from '@/types/ranking';
import { Users, MapPin, Calendar, Trophy } from 'lucide-react';

const AGE_GROUPS = [
  { value: '10s', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s', label: '60代' },
  { value: '70s+', label: '70代以上' }
];

const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer_not_to_say', label: '回答しない' }
];

export const RankingTabs: React.FC = () => {
  const [filters, setFilters] = useState<RankingFilters>({
    tab: 'overall',
    period: '30d'
  });

  const [compareMode, setCompareMode] = useState(false);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);

  // ランキングデータ取得
  const { data, isLoading } = useRanking({
    period: filters.period,
    prefectureCode: filters.prefecture,
    ageGroup: filters.ageGroup,
    gender: filters.gender,
    limit: 20,
    offset: 0
  });

  const handleTabChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      tab: value as RankingTabType,
      prefecture: undefined,
      ageGroup: undefined,
      gender: undefined
    }));
    setCompareMode(false);
  };

  const handlePeriodChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      period: value as '7d' | '30d' | 'all'
    }));
  };

  const handlePrefectureChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      prefecture: value === 'all' ? undefined : value
    }));
  };

  const handleAgeGroupChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      ageGroup: value === 'all' ? undefined : value
    }));
  };

  const handleGenderChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      gender: value === 'all' ? undefined : value
    }));
  };

  const handleExport = async () => {
    await exportRankingCSV({
      period: filters.period,
      prefectureCode: filters.prefecture,
      ageGroup: filters.ageGroup,
      gender: filters.gender
    });
  };

  const getSummaryIcon = () => {
    switch (filters.tab) {
      case 'prefecture':
        return <MapPin className="w-5 h-5" />;
      case 'age':
        return <Calendar className="w-5 h-5" />;
      case 'gender':
        return <Users className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSummaryIcon()}
            アクセントランキング
          </CardTitle>
          <CardDescription>
            地域・年代・性別ごとの人気語ランキングを表示
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 期間選択 */}
          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm font-medium">期間:</span>
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">過去7日間</SelectItem>
                <SelectItem value="30d">過去30日間</SelectItem>
                <SelectItem value="all">全期間</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タブ切り替え */}
          <Tabs value={filters.tab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overall">総合</TabsTrigger>
              <TabsTrigger value="prefecture">都道府県別</TabsTrigger>
              <TabsTrigger value="age">年代別</TabsTrigger>
              <TabsTrigger value="gender">性別別</TabsTrigger>
            </TabsList>

            {/* 総合ランキング */}
            <TabsContent value="overall" className="space-y-4">
              {data?.summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.summary.totalVotes.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">総投票数</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.summary.uniqueWords.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">投票された語数</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.summary.participantCount.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">参加者数</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              <RankingTable 
                items={data?.items || []} 
                isLoading={isLoading}
                onExport={handleExport}
              />
            </TabsContent>

            {/* 都道府県別ランキング */}
            <TabsContent value="prefecture" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Select 
                  value={filters.prefecture || 'all'} 
                  onValueChange={handlePrefectureChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全国</SelectItem>
                    {PREFECTURES.map(pref => (
                      <SelectItem key={pref.code} value={pref.code}>
                        {pref.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filters.prefecture && (
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {compareMode ? '通常表示に戻る' : '他の都道府県と比較'}
                  </button>
                )}
              </div>

              {compareMode && filters.prefecture ? (
                <PrefectureComparison 
                  basePrefecture={filters.prefecture}
                  selectedPrefectures={selectedPrefectures}
                  onPrefectureSelect={setSelectedPrefectures}
                />
              ) : (
                <>
                  {data?.prefecture && (
                    <div className="mb-4">
                      <Badge variant="outline" className="text-sm">
                        {data.prefecture.name} ({data.prefecture.region}地方)
                      </Badge>
                    </div>
                  )}
                  <RankingTable 
                    items={data?.items || []} 
                    isLoading={isLoading}
                    showRankChange={true}
                    onExport={handleExport}
                  />
                </>
              )}
            </TabsContent>

            {/* 年代別ランキング */}
            <TabsContent value="age" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Select 
                  value={filters.ageGroup || 'all'} 
                  onValueChange={handleAgeGroupChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="年代を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全年代</SelectItem>
                    {AGE_GROUPS.map(age => (
                      <SelectItem key={age.value} value={age.value}>
                        {age.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.ageGroup && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-sm">
                    {AGE_GROUPS.find(a => a.value === filters.ageGroup)?.label}
                  </Badge>
                </div>
              )}

              <RankingTable 
                items={data?.items || []} 
                isLoading={isLoading}
                onExport={handleExport}
              />
            </TabsContent>

            {/* 性別別ランキング */}
            <TabsContent value="gender" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Select 
                  value={filters.gender || 'all'} 
                  onValueChange={handleGenderChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全性別</SelectItem>
                    {GENDERS.map(gender => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.gender && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-sm">
                    {GENDERS.find(g => g.value === filters.gender)?.label}
                  </Badge>
                </div>
              )}

              <RankingTable 
                items={data?.items || []} 
                isLoading={isLoading}
                onExport={handleExport}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};