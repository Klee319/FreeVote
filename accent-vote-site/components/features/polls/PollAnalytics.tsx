'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { motion, AnimatePresence } from 'framer-motion';
import { PollAnalyticsData } from '@/types/poll';
import {
  TrendingUp,
  Activity,
  Clock,
  Zap,
  BarChart3,
  Timer,
  Target,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface PollAnalyticsProps {
  analyticsData: PollAnalyticsData;
  pollEndDate?: string;
  className?: string;
  showAnimation?: boolean;
  autoRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

// トレンドアイコンの取得
const getTrendIcon = (current: number, average: number) => {
  const ratio = current / average;
  if (ratio > 1.2) return { icon: ChevronUp, color: 'text-green-500', label: '上昇中' };
  if (ratio < 0.8) return { icon: ChevronDown, color: 'text-red-500', label: '下降中' };
  return { icon: Activity, color: 'text-gray-500', label: '安定' };
};

// 曜日の名前
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

// 時間帯の名前
const getTimeOfDay = (hour: number) => {
  if (hour >= 5 && hour < 9) return '早朝';
  if (hour >= 9 && hour < 12) return '午前';
  if (hour >= 12 && hour < 15) return '昼';
  if (hour >= 15 && hour < 18) return '午後';
  if (hour >= 18 && hour < 21) return '夕方';
  if (hour >= 21 || hour < 5) return '夜間';
  return '';
};

export function PollAnalytics({
  analyticsData,
  pollEndDate,
  className,
  showAnimation = true,
  autoRefresh = false,
  onRefresh,
}: PollAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'trend' | 'velocity' | 'peak'>('trend');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | 'all'>('24h');
  
  const trendChartRef = useRef<HTMLDivElement>(null);
  const velocityChartRef = useRef<HTMLDivElement>(null);
  const peakChartRef = useRef<HTMLDivElement>(null);
  
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const velocityChartInstance = useRef<echarts.ECharts | null>(null);
  const peakChartInstance = useRef<echarts.ECharts | null>(null);

  // トレンドアイコン情報
  const trendInfo = useMemo(() => 
    getTrendIcon(analyticsData.votingVelocity.current, analyticsData.votingVelocity.average),
    [analyticsData.votingVelocity]
  );

  // 時間範囲によるデータフィルタリング
  const filteredTrendData = useMemo(() => {
    const now = new Date();
    let startTime: Date;
    
    switch (selectedTimeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        return analyticsData.trendData;
    }
    
    return analyticsData.trendData.filter(
      d => new Date(d.timestamp) >= startTime
    );
  }, [analyticsData.trendData, selectedTimeRange]);

  // 投票トレンドグラフ
  useEffect(() => {
    if (activeTab !== 'trend' || !trendChartRef.current) return;

    if (!trendChartInstance.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = trendChartInstance.current;

    // データ準備
    const timestamps = filteredTrendData.map(d => d.timestamp);
    const seriesData = filteredTrendData[0]?.optionTrends.map((_, optIndex) => ({
      name: filteredTrendData[0].optionTrends[optIndex].optionText,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: filteredTrendData.map(d => d.optionTrends[optIndex]?.voteCount || 0),
      areaStyle: {
        opacity: 0.1,
      },
      emphasis: {
        focus: 'series',
      },
    })) || [];

    const option: echarts.EChartsOption = {
      title: {
        text: '投票数の推移',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        formatter: (params: any) => {
          const timestamp = params[0].axisValue;
          const date = new Date(timestamp);
          let result = `${date.toLocaleString('ja-JP')}<br/>`;
          
          params.forEach((param: any) => {
            const percentage = (
              (param.value / filteredTrendData[param.dataIndex].cumulativeVotes) * 100
            ).toFixed(1);
            result += `${param.marker} ${param.seriesName}: ${param.value}票 (${percentage}%)<br/>`;
          });
          
          result += `<br/>累計: ${filteredTrendData[params[0].dataIndex].cumulativeVotes}票`;
          return result;
        },
      },
      legend: {
        data: seriesData.map(s => s.name),
        bottom: 10,
      },
      grid: {
        left: '10%',
        right: '10%',
        top: 60,
        bottom: 80,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            if (selectedTimeRange === '1h' || selectedTimeRange === '6h') {
              return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            } else if (selectedTimeRange === '24h') {
              return date.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit' });
            } else {
              return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
            }
          },
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}票',
        },
      },
      series: seriesData,
      dataZoom: [
        {
          type: 'inside',
          start: selectedTimeRange === 'all' ? 90 : 0,
          end: 100,
        },
        {
          start: selectedTimeRange === 'all' ? 90 : 0,
          end: 100,
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, filteredTrendData, selectedTimeRange]);

  // 投票速度グラフ
  useEffect(() => {
    if (activeTab !== 'velocity' || !velocityChartRef.current) return;

    if (!velocityChartInstance.current) {
      velocityChartInstance.current = echarts.init(velocityChartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = velocityChartInstance.current;

    // 速度データの計算
    const velocityData = filteredTrendData.slice(1).map((d, i) => {
      const prevData = filteredTrendData[i];
      const timeDiff = (new Date(d.timestamp).getTime() - new Date(prevData.timestamp).getTime()) / (1000 * 60 * 60); // 時間単位
      const voteDiff = d.cumulativeVotes - prevData.cumulativeVotes;
      return {
        timestamp: d.timestamp,
        velocity: timeDiff > 0 ? voteDiff / timeDiff : 0,
      };
    });

    const option: echarts.EChartsOption = {
      title: {
        text: '投票速度の変化',
        subtext: '票/時',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue);
          return `${date.toLocaleString('ja-JP')}<br/>
                  投票速度: ${params[0].value.toFixed(1)} 票/時`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: 80,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        data: velocityData.map(d => d.timestamp),
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          },
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value} 票/時',
        },
      },
      series: [
        {
          type: 'line',
          data: velocityData.map(d => d.velocity),
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.1)' },
            ]),
          },
          itemStyle: {
            color: '#3b82f6',
          },
          markLine: {
            data: [
              {
                type: 'average',
                name: '平均速度',
                label: {
                  formatter: '平均: {c} 票/時',
                },
              },
              {
                yAxis: analyticsData.votingVelocity.peak,
                name: 'ピーク速度',
                lineStyle: {
                  color: '#ef4444',
                  type: 'dashed',
                },
                label: {
                  formatter: 'ピーク: {c} 票/時',
                },
              },
            ],
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, filteredTrendData, analyticsData.votingVelocity]);

  // ピーク時間帯ヒートマップ
  useEffect(() => {
    if (activeTab !== 'peak' || !peakChartRef.current) return;

    if (!peakChartInstance.current) {
      peakChartInstance.current = echarts.init(peakChartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = peakChartInstance.current;

    // ヒートマップデータの準備
    const hours = Array.from({ length: 24 }, (_, i) => `${i}時`);
    const days = DAY_NAMES;
    
    const heatmapData: any[] = [];
    analyticsData.peakHours.forEach(item => {
      heatmapData.push([item.dayOfWeek, item.hour, item.averageVotes]);
    });

    const maxVotes = Math.max(...analyticsData.peakHours.map(h => h.averageVotes));

    const option: echarts.EChartsOption = {
      title: {
        text: '時間帯別投票傾向',
        subtext: '曜日×時間帯の平均投票数',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const dayName = DAY_NAMES[params.data[0]];
          const hour = params.data[1];
          const votes = params.data[2];
          const timeOfDay = getTimeOfDay(hour);
          return `${dayName}曜日 ${hour}時 (${timeOfDay})<br/>平均投票数: ${votes.toFixed(1)}票`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: 100,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true,
        },
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: 0,
        max: maxVotes,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        inRange: {
          color: ['#e5e7eb', '#fef3c7', '#fbbf24', '#f59e0b', '#dc2626'],
        },
      },
      series: [
        {
          name: '投票数',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, analyticsData.peakHours]);

  // リフレッシュ処理
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('分析データの更新に失敗しました:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 自動リフレッシュ
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(handleRefresh, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // 残り時間の計算
  const remainingTime = useMemo(() => {
    if (!pollEndDate) return null;
    
    const end = new Date(pollEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, expired: false };
  }, [pollEndDate]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 統計サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">現在の投票速度</p>
                  <p className="text-2xl font-bold">
                    {analyticsData.votingVelocity.current.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">票/時</p>
                </div>
                <div className={cn('p-2 rounded-lg', trendInfo.color)}>
                  <trendInfo.icon className="h-5 w-5" />
                </div>
              </div>
              <Badge variant="outline" className="mt-2">
                {trendInfo.label}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ピーク速度</p>
                  <p className="text-2xl font-bold">
                    {analyticsData.votingVelocity.peak.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">票/時</p>
                </div>
                <div className="p-2 rounded-lg text-orange-500">
                  <Flame className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(analyticsData.votingVelocity.peakTime).toLocaleString('ja-JP')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">予測総投票数</p>
                  <p className="text-2xl font-bold">
                    {analyticsData.projectedTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">票</p>
                </div>
                <div className="p-2 rounded-lg text-blue-500">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <Progress 
                value={analyticsData.completionRate} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">残り時間</p>
                  {remainingTime && !remainingTime.expired ? (
                    <div className="text-lg font-bold">
                      {remainingTime.days > 0 && `${remainingTime.days}日`}
                      {remainingTime.hours}時間{remainingTime.minutes}分
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-red-500">終了</p>
                  )}
                </div>
                <div className="p-2 rounded-lg text-purple-500">
                  <Timer className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* メインコンテンツ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              投票分析
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* 時間範囲選択 */}
              <div className="flex gap-1">
                {(['1h', '6h', '24h', '7d', 'all'] as const).map(range => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range === 'all' ? '全期間' : range}
                  </Button>
                ))}
              </div>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? '更新中...' : '更新'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="trend" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                トレンド
              </TabsTrigger>
              <TabsTrigger value="velocity" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                投票速度
              </TabsTrigger>
              <TabsTrigger value="peak" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ピーク分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="space-y-4">
              <div ref={trendChartRef} className="w-full h-[400px]" />
              
              {/* トレンド分析サマリー */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  現在、
                  {analyticsData.trendData[0]?.optionTrends[0] && (
                    <span className="font-bold">
                      「{analyticsData.trendData[0].optionTrends[0].optionText}」
                    </span>
                  )}
                  が最も多くの票を集めています。
                  投票速度は{trendInfo.label.toLowerCase()}しており、
                  このペースだと最終的に約{analyticsData.projectedTotal.toLocaleString()}票に達する見込みです。
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="velocity" className="space-y-4">
              <div ref={velocityChartRef} className="w-full h-[400px]" />
              
              {/* 速度分析サマリー */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">平均速度</p>
                  <p className="text-xl font-bold">
                    {analyticsData.votingVelocity.average.toFixed(1)} 票/時
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">最高速度</p>
                  <p className="text-xl font-bold text-orange-600">
                    {analyticsData.votingVelocity.peak.toFixed(1)} 票/時
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">現在速度</p>
                  <p className="text-xl font-bold text-blue-600">
                    {analyticsData.votingVelocity.current.toFixed(1)} 票/時
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="peak" className="space-y-4">
              <div ref={peakChartRef} className="w-full h-[400px]" />
              
              {/* ピーク時間帯ランキング */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">投票が多い時間帯 TOP 5</h4>
                {analyticsData.peakHours
                  .sort((a, b) => b.averageVotes - a.averageVotes)
                  .slice(0, 5)
                  .map((peak, index) => (
                    <motion.div
                      key={`${peak.dayOfWeek}-${peak.hour}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {index + 1}位
                        </Badge>
                        <span className="text-sm">
                          {DAY_NAMES[peak.dayOfWeek]}曜日 {peak.hour}時台
                        </span>
                      </div>
                      <span className="text-sm font-bold">
                        平均 {peak.averageVotes.toFixed(1)} 票
                      </span>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}