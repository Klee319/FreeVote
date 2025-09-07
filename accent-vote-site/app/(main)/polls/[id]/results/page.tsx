'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  BarChart2, 
  PieChart, 
  Users,
  TrendingUp,
  Download,
  Share2,
  RefreshCw,
  Map as MapIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommonStatisticsView, StatisticsMode, ViewType as StatsViewType } from '@/components/features/stats/CommonStatisticsView';
import { CommonMapVisualization, MapDataItem } from '@/components/features/stats/CommonMapVisualization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PollDetail, PollResults, ChartType } from '@/types/polls';
import { Prefecture, AgeGroup } from '@/types';

// EChartsを動的インポート（サーバーサイドレンダリングを避ける）
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// カテゴリに応じたラベルを返す
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: '一般',
    tech: '技術',
    culture: '文化',
    lifestyle: 'ライフスタイル',
    entertainment: 'エンタメ',
    education: '教育',
    business: 'ビジネス',
    other: 'その他'
  };
  return labels[category] || category;
}

// 都道府県データ
const PREFECTURE_DATA: Record<Prefecture, string> = {
  '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
  '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
  '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
  '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
  '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
  '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
  '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
  '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
  '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
  '46': '鹿児島県', '47': '沖縄県'
};

// 都道府県コードから名前を取得
function getPrefectureName(code: Prefecture): string {
  return PREFECTURE_DATA[code] || '';
}

// 年齢グループのラベルを取得
function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    '10s': '10代',
    '20s': '20代',
    '30s': '30代',
    '40s': '40代',
    '50s': '50代',
    '60s': '60代',
    '70s+': '70代以上'
  };
  return labels[ageGroup] || ageGroup;
}

// チャートの色配列を生成
function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // 色が足りない場合は自動生成
  const colors = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 360 / count) % 360;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

// 最適なチャートタイプを選択
function selectOptimalChartType(optionCount: number): ChartType {
  if (optionCount === 2) return 'bar';
  if (optionCount <= 5) return 'pie';
  if (optionCount <= 10) return 'horizontal-bar';
  return 'bar';
}

// 結果ページコンポーネント
export default function PollResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<'chart' | 'demographics' | 'trends'>('chart');
  const [chartType, setChartType] = useState<ChartType>('auto');
  const [demographicBreakdown, setDemographicBreakdown] = useState<'age' | 'prefecture' | 'gender'>('age');
  const [sortBy, setSortBy] = useState<'default' | 'prefecture' | 'age' | 'gender'>('default');
  const [statisticsMode, setStatisticsMode] = useState<StatisticsMode>('overall');
  const [statsViewType, setStatsViewType] = useState<StatsViewType>('ranking');
  const [filterPrefecture, setFilterPrefecture] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [pollId, setPollId] = useState<string>('');

  // paramsを解決
  useEffect(() => {
    const resolveParams = async () => {
      const { id } = await params;
      setPollId(id);
    };
    resolveParams();
  }, [params]);

  // データ取得
  useEffect(() => {
    if (!pollId) return;
    
    fetchData();
    // 30秒ごとに自動更新
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pollId]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // 投票詳細と結果を並行して取得
      const [pollResponse, resultsResponse] = await Promise.all([
        fetch(`/api/polls/${pollId}`),
        fetch(`/api/polls/${pollId}/results`)
      ]);
      
      const pollData = await pollResponse.json();
      const resultsData = await resultsResponse.json();
      
      if (pollData.success) {
        setPoll(pollData.poll);
      }
      
      if (resultsData.success) {
        setResults(resultsData.results);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 手動更新
  const handleRefresh = () => {
    fetchData(true);
  };

  // チャート設定を生成
  const chartOptions = useMemo(() => {
    if (!results) return null;
    
    const colors = generateChartColors(results.options.length);
    const actualChartType = chartType === 'auto' 
      ? selectOptimalChartType(results.options.length)
      : chartType;
    
    if (actualChartType === 'pie' || actualChartType === 'donut') {
      return {
        title: {
          text: '投票結果',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}票 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '投票結果',
            type: 'pie',
            radius: actualChartType === 'donut' ? ['40%', '70%'] : '70%',
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}: {d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            data: results.options.map((option, index) => ({
              value: option.voteCount,
              name: option.text,
              itemStyle: { color: colors[index] }
            }))
          }
        ]
      };
    } else if (actualChartType === 'horizontal-bar') {
      return {
        title: {
          text: '投票結果',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const item = params[0];
            return `${item.name}: ${item.value}票 (${item.data.percentage}%)`;
          }
        },
        grid: {
          left: '20%',
          right: '10%',
          top: '15%',
          bottom: '10%'
        },
        xAxis: {
          type: 'value',
          max: results.totalVotes
        },
        yAxis: {
          type: 'category',
          data: results.options.map(opt => opt.text),
          inverse: true,
          axisLabel: {
            width: 100,
            overflow: 'truncate'
          }
        },
        series: [
          {
            name: '投票数',
            type: 'bar',
            data: results.options.map((option, index) => ({
              value: option.voteCount,
              percentage: option.percentage,
              itemStyle: { color: colors[index] }
            })),
            label: {
              show: true,
              position: 'right',
              formatter: '{c}票'
            }
          }
        ]
      };
    } else {
      // 縦棒グラフ
      return {
        title: {
          text: '投票結果',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const item = params[0];
            return `${item.name}: ${item.value}票 (${item.data.percentage}%)`;
          }
        },
        grid: {
          left: '10%',
          right: '10%',
          top: '15%',
          bottom: '15%'
        },
        xAxis: {
          type: 'category',
          data: results.options.map(opt => opt.text),
          axisLabel: {
            interval: 0,
            rotate: results.options.length > 5 ? 45 : 0,
            width: 80,
            overflow: 'truncate'
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '投票数',
            type: 'bar',
            data: results.options.map((option, index) => ({
              value: option.voteCount,
              percentage: option.percentage,
              itemStyle: { 
                color: colors[index],
                borderRadius: [4, 4, 0, 0]
              }
            })),
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => `${params.data.percentage}%`
            }
          }
        ]
      };
    }
  }, [results, chartType]);

  // 属性別チャート設定
  const demographicChartOptions = useMemo(() => {
    if (!results?.demographics) return null;
    
    if (demographicBreakdown === 'gender') {
      // 性別別データ
      const genderData = [
        { name: '男性', value: results.demographics.byGender?.male || 0 },
        { name: '女性', value: results.demographics.byGender?.female || 0 },
        { name: 'その他', value: results.demographics.byGender?.other || 0 },
      ].filter(item => item.value > 0);
      
      return {
        title: {
          text: '性別投票分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}票 ({d}%)'
        },
        series: [
          {
            name: '投票数',
            type: 'pie',
            radius: '60%',
            data: genderData,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {d}%'
            }
          }
        ]
      };
    } else if (demographicBreakdown === 'age') {
      const ageData = Object.entries(results.demographics.byAge || {});
      return {
        title: {
          text: '年齢別投票分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ageData.map(([age]) => getAgeGroupLabel(age as AgeGroup))
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '投票数',
            type: 'bar',
            data: ageData.map(([_, count]) => count),
            itemStyle: {
              color: '#3b82f6',
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      };
    } else {
      // 都道府県別（上位10件）
      const prefectureData = Object.entries(results.demographics.byPrefecture || {})
        .map(([code, count]) => ({
          name: getPrefectureName(code as Prefecture),
          value: count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      return {
        title: {
          text: '都道府県別投票数（上位10件）',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '15%',
          right: '10%',
          top: '15%',
          bottom: '10%'
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: prefectureData.map(d => d.name),
          inverse: true
        },
        series: [
          {
            name: '投票数',
            type: 'bar',
            data: prefectureData.map(d => d.value),
            itemStyle: {
              color: '#10b981'
            }
          }
        ]
      };
    }
  }, [results, demographicBreakdown]);

  // データエクスポート
  const handleExport = () => {
    if (!results || !poll) return;
    
    const csvContent = [
      ['選択肢', '投票数', '割合(%)'],
      ...results.options.map(opt => [
        opt.text,
        opt.voteCount.toString(),
        opt.percentage.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${poll.title}_results.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll || !results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            結果データが見つかりませんでした
          </AlertDescription>
        </Alert>
        <Link href="/polls">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            投票一覧に戻る
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/polls/${pollId}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            投票詳細に戻る
          </Button>
        </Link>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            更新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV出力
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${poll.title}の結果`,
                  text: `投票結果: ${results.totalVotes}票`,
                  url: window.location.href,
                });
              }
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            シェア
          </Button>
        </div>
      </div>

      {/* タイトル */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              {getCategoryLabel(poll.category)}
            </Badge>
            <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
              {poll.status === 'active' ? '投票受付中' : '投票終了'}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {poll.description && (
            <CardDescription>{poll.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* 統計サマリー */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                総投票数
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.totalVotes}票</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                参加者数
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.uniqueVoters}人</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                最多得票
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {results.options[0]?.text || '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              {results.options[0]?.percentage || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>投票結果詳細</CardTitle>
            <div className="flex gap-2">
              <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)}>
                <TabsList>
                  <TabsTrigger value="chart">グラフ</TabsTrigger>
                  <TabsTrigger value="demographics">集計状況</TabsTrigger>
                  <TabsTrigger value="trends">推移</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {viewType === 'chart' && (
                <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動選択</SelectItem>
                    <SelectItem value="bar">棒グラフ</SelectItem>
                    <SelectItem value="pie">円グラフ</SelectItem>
                    <SelectItem value="donut">ドーナツ</SelectItem>
                    <SelectItem value="horizontal-bar">横棒グラフ</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {viewType === 'chart' && (
                <div className="flex gap-2">
                  <Select value={demographicBreakdown} onValueChange={(v) => setDemographicBreakdown(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="age">年齢別</SelectItem>
                      <SelectItem value="prefecture">都道府県別</SelectItem>
                      <SelectItem value="gender">性別</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="ソート" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">デフォルト</SelectItem>
                      <SelectItem value="prefecture">県別ソート</SelectItem>
                      <SelectItem value="age">年代別ソート</SelectItem>
                      <SelectItem value="gender">性別ソート</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewType === 'chart' && chartOptions && (
            <ReactECharts 
              option={chartOptions}
              style={{ height: '400px' }}
              theme="light"
            />
          )}
          
          {viewType === 'demographics' && (
            <CommonStatisticsView
              mode={statisticsMode}
              viewType={statsViewType}
              onModeChange={setStatisticsMode}
              onViewTypeChange={setStatsViewType}
              title="集計状況"
            >
              {statisticsMode === 'overall' ? (
                /* 総合順位表示 */
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">全体の投票結果</h3>
                  {results.options.map((option, index) => (
                    <div key={option.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                          <div>
                            <div className="font-medium">{option.text}</div>
                            {option.description && (
                              <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{option.voteCount}票</div>
                          <div className="text-sm text-gray-500">{option.percentage}%</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : statisticsMode === 'prefecture' && statsViewType === 'ranking' ? (
                /* 県別ランキング表示 */
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">都道府県別ランキング</h3>
                  {results?.demographics?.byPrefecture && (
                    <div className="space-y-2">
                      {Object.entries(results.demographics.byPrefecture)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([code, count], index) => (
                          <div key={code} className="flex justify-between items-center p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                              <span className="font-medium">{getPrefectureName(code as Prefecture)}</span>
                            </div>
                            <span className="text-gray-600">{count}票</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : statisticsMode === 'prefecture' && statsViewType === 'map' ? (
                /* 地図表示 */
                <div>
                  {(() => {
                    // 各県の1位選択肢データを準備
                    if (!results?.demographics?.byPrefecture || !results?.options) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          地図表示用のデータがありません
                        </div>
                      );
                    }

                    // 都道府県ごとの投票データを集計（仮のデータ構造）
                    // 実際のAPIから詳細データを取得する必要がある場合は、ここで処理
                    const mapData: MapDataItem[] = Object.entries(results.demographics.byPrefecture)
                      .map(([prefCode, totalVotes]) => {
                        // 各県の1位を計算（現在は全体の1位を仮で使用）
                        const topOption = results.options[0];
                        
                        return {
                          prefectureCode: prefCode,
                          name: getPrefectureName(prefCode as Prefecture),
                          topItem: topOption?.text || '未投票',
                          topItemCount: Math.floor(totalVotes * (topOption?.percentage || 0) / 100),
                          totalVotes: totalVotes,
                          percentage: topOption?.percentage || 0,
                        };
                      })
                      .filter(item => item.totalVotes > 0);

                    return (
                      <CommonMapVisualization
                        data={mapData}
                        selectedPrefecture={filterPrefecture !== 'all' ? filterPrefecture : undefined}
                        onPrefectureSelect={(prefecture) => setFilterPrefecture(prefecture)}
                        title="都道府県別投票分布"
                        colorScheme="gradient"
                        showLegend={false}
                      />
                    );
                  })()}
                </div>
              ) : statisticsMode === 'age' ? (
                /* 年代別表示 */
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">年代別投票分布</h3>
                  {results?.demographics?.byAge && (
                    <div className="space-y-3">
                      {Object.entries(results.demographics.byAge)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([ageGroup, count]) => {
                          const total = results.totalVotes;
                          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                          return (
                            <div key={ageGroup} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{getAgeGroupLabel(ageGroup as AgeGroup)}</span>
                                <span className="text-gray-600">{count}票 ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              ) : statisticsMode === 'gender' ? (
                /* 性別表示 */
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">性別投票分布</h3>
                  {results?.demographics?.byGender && (
                    <div className="space-y-3">
                      {Object.entries(results.demographics.byGender)
                        .map(([gender, count]) => {
                          const total = results.totalVotes;
                          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                          const genderLabels: Record<string, string> = {
                            male: '男性',
                            female: '女性',
                            other: 'その他'
                          };
                          return (
                            <div key={gender} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{genderLabels[gender] || gender}</span>
                                <span className="text-gray-600">{count}票 ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              ) : null}
            </CommonStatisticsView>
          )}
          
          {viewType === 'trends' && (
            <div className="text-center py-12 text-muted-foreground">
              投票推移グラフは準備中です
            </div>
          )}
        </CardContent>
      </Card>

      {/* フィルタリングオプション */}
      {false && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>フィルタリング</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">都道府県</label>
                <Select value={filterPrefecture} onValueChange={setFilterPrefecture}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {Object.entries(PREFECTURE_DATA).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">年代</label>
                <Select value={filterAge} onValueChange={setFilterAge}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="10s">10代</SelectItem>
                    <SelectItem value="20s">20代</SelectItem>
                    <SelectItem value="30s">30代</SelectItem>
                    <SelectItem value="40s">40代</SelectItem>
                    <SelectItem value="50s">50代</SelectItem>
                    <SelectItem value="60s">60代</SelectItem>
                    <SelectItem value="70s+">70代以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">性別</label>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setFilterPrefecture('all');
                setFilterAge('all');
                setFilterGender('all');
              }}
            >
              フィルターをクリア
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 選択肢ごとの詳細 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>選択肢別詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.options.map((option, index) => (
              <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{option.text}</div>
                  {option.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold">{option.percentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {option.voteCount}票
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}