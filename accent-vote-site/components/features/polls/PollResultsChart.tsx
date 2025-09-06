'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { motion, AnimatePresence } from 'framer-motion';
import { PollOption } from '@/types/poll';
import { Trophy, TrendingUp, Award, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PollResultsChartProps {
  options: PollOption[];
  pollTitle: string;
  totalVotes: number;
  showAnimation?: boolean;
  autoSelectChartType?: boolean;
  className?: string;
}

type ChartType = 'bar' | 'pie' | 'donut' | 'horizontal-bar' | 'race-bar';

// グラフの色パレット（競争心を煽る色設定）
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

// 勝者用の特別な色
const WINNER_COLOR = '#fbbf24'; // amber-400
const WINNER_GRADIENT = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: '#fde047' },
    { offset: 1, color: '#f59e0b' },
  ],
};

export function PollResultsChart({
  options,
  pollTitle,
  totalVotes,
  showAnimation = true,
  autoSelectChartType = true,
  className,
}: PollResultsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
  const [animationPlayed, setAnimationPlayed] = useState(false);

  // ソートされた選択肢（投票数順）
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => b.voteCount - a.voteCount);
  }, [options]);

  // 1位、2位、3位を取得
  const topOptions = useMemo(() => {
    return sortedOptions.slice(0, 3);
  }, [sortedOptions]);

  // グラフタイプの自動選択ロジック
  const recommendedChartType = useMemo(() => {
    const optionCount = options.length;
    
    if (optionCount === 2) {
      // 2択の場合: 水平バーまたはレースバー
      return 'race-bar';
    } else if (optionCount <= 4) {
      // 3-4択の場合: 円グラフまたはドーナツ
      return 'donut';
    } else if (optionCount <= 8) {
      // 5-8択の場合: 縦棒グラフ
      return 'bar';
    } else {
      // 9択以上: 水平バー
      return 'horizontal-bar';
    }
  }, [options.length]);

  // グラフタイプの設定
  useEffect(() => {
    if (autoSelectChartType) {
      setSelectedChartType(recommendedChartType);
    }
  }, [autoSelectChartType, recommendedChartType]);

  // EChartsの初期化と更新
  useEffect(() => {
    if (!chartRef.current) return;

    // チャートインスタンスの初期化
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;
    let option: echarts.EChartsOption = {};

    // 共通の設定
    const commonOption = {
      animation: showAnimation && !animationPlayed,
      animationDuration: 1500,
      animationEasing: 'elasticOut',
    };

    // チャートタイプごとのオプション設定
    switch (selectedChartType) {
      case 'race-bar':
        // レースバー（2択向け、競争感を演出）
        option = {
          ...commonOption,
          title: {
            text: '投票レース',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          grid: {
            left: '15%',
            right: '15%',
            top: 60,
            bottom: 40,
          },
          xAxis: {
            type: 'value',
            max: totalVotes,
            axisLabel: {
              formatter: '{value}票',
            },
          },
          yAxis: {
            type: 'category',
            data: sortedOptions.map(opt => opt.text),
            axisLabel: {
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          series: [{
            type: 'bar',
            data: sortedOptions.map((opt, index) => ({
              value: opt.voteCount,
              itemStyle: {
                color: index === 0 ? WINNER_GRADIENT : CHART_COLORS[index % CHART_COLORS.length],
                borderRadius: [0, 10, 10, 0],
                shadowColor: index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                shadowBlur: index === 0 ? 20 : 10,
              },
              label: {
                show: true,
                position: 'right',
                formatter: (params: any) => {
                  const percentage = ((params.value / totalVotes) * 100).toFixed(1);
                  return `${params.value}票 (${percentage}%)`;
                },
                fontSize: 12,
                fontWeight: 'bold',
              },
            })),
            barWidth: '60%',
            animationDelay: (idx: number) => idx * 300,
          }],
        };
        break;

      case 'donut':
      case 'pie':
        // ドーナツ/円グラフ
        option = {
          ...commonOption,
          title: {
            text: '投票分布',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c}票 ({d}%)',
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
            data: options.map(opt => opt.text),
            textStyle: {
              fontSize: 12,
            },
          },
          series: [{
            name: '投票',
            type: 'pie',
            radius: selectedChartType === 'donut' ? ['40%', '70%'] : '70%',
            center: ['60%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 12,
              fontWeight: 'bold',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold',
              },
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.3)',
              },
            },
            data: sortedOptions.map((opt, index) => ({
              value: opt.voteCount,
              name: opt.text,
              itemStyle: {
                color: index === 0 ? WINNER_GRADIENT : CHART_COLORS[index % CHART_COLORS.length],
              },
            })),
            animationType: 'scale',
            animationEasing: 'elasticOut',
          }],
        };
        break;

      case 'horizontal-bar':
        // 水平バーグラフ（選択肢が多い場合）
        option = {
          ...commonOption,
          title: {
            text: 'ランキング',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          grid: {
            left: '25%',
            right: '10%',
            top: 60,
            bottom: 40,
          },
          xAxis: {
            type: 'value',
            axisLabel: {
              formatter: '{value}票',
            },
          },
          yAxis: {
            type: 'category',
            data: sortedOptions.reverse().map(opt => opt.text),
            axisLabel: {
              fontSize: 11,
              width: 100,
              overflow: 'truncate',
            },
          },
          series: [{
            type: 'bar',
            data: sortedOptions.reverse().map((opt, index) => ({
              value: opt.voteCount,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: CHART_COLORS[index % CHART_COLORS.length] },
                  { offset: 1, color: CHART_COLORS[(index + 1) % CHART_COLORS.length] },
                ]),
                borderRadius: [0, 5, 5, 0],
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{c}票',
                fontSize: 11,
              },
            })),
            barWidth: '70%',
            animationDelay: (idx: number) => idx * 50,
          }],
        };
        break;

      case 'bar':
      default:
        // 縦棒グラフ（標準）
        option = {
          ...commonOption,
          title: {
            text: '投票結果',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow',
            },
            formatter: (params: any) => {
              const data = params[0];
              const percentage = ((data.value / totalVotes) * 100).toFixed(1);
              return `${data.name}<br/>投票数: ${data.value}票<br/>割合: ${percentage}%`;
            },
          },
          grid: {
            left: '10%',
            right: '10%',
            top: 60,
            bottom: 100,
          },
          xAxis: {
            type: 'category',
            data: sortedOptions.map(opt => opt.text),
            axisLabel: {
              interval: 0,
              rotate: 45,
              fontSize: 11,
            },
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '{value}票',
            },
          },
          series: [{
            type: 'bar',
            data: sortedOptions.map((opt, index) => ({
              value: opt.voteCount,
              itemStyle: {
                color: index === 0 
                  ? WINNER_GRADIENT 
                  : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: CHART_COLORS[index % CHART_COLORS.length] },
                      { offset: 1, color: CHART_COLORS[(index + 1) % CHART_COLORS.length] },
                    ]),
                borderRadius: [5, 5, 0, 0],
                shadowColor: index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                shadowBlur: index === 0 ? 15 : 5,
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 20,
                  shadowColor: 'rgba(0, 0, 0, 0.3)',
                },
              },
            })),
            barWidth: '60%',
            animationDelay: (idx: number) => idx * 100,
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                const percentage = ((params.value / totalVotes) * 100).toFixed(1);
                return `${percentage}%`;
              },
              fontSize: 11,
              fontWeight: 'bold',
            },
          }],
        };
        break;
    }

    chart.setOption(option);
    setAnimationPlayed(true);

    // ウィンドウリサイズ対応
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [options, sortedOptions, selectedChartType, totalVotes, showAnimation, animationPlayed]);

  // チャートタイプ切替ボタン
  const chartTypeButtons = [
    { type: 'bar' as ChartType, label: '棒グラフ', icon: '📊' },
    { type: 'horizontal-bar' as ChartType, label: '横棒グラフ', icon: '📈' },
    { type: 'pie' as ChartType, label: '円グラフ', icon: '🥧' },
    { type: 'donut' as ChartType, label: 'ドーナツ', icon: '🍩' },
    { type: 'race-bar' as ChartType, label: 'レース', icon: '🏁' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* トップ3表彰台 */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            トップ3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {topOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative">
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg p-4 border-2',
                      index === 0 
                        ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-400 shadow-lg' 
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                    )}
                  >
                    <div className="text-2xl mb-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="font-bold text-sm mb-1 line-clamp-2">
                      {option.text}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {option.voteCount}
                    </div>
                    <div className="text-xs text-gray-600">
                      {option.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* グラフ表示 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              投票結果グラフ
            </CardTitle>
            {/* グラフタイプ切替 */}
            <div className="flex gap-1">
              {chartTypeButtons.map(btn => (
                <button
                  key={btn.type}
                  onClick={() => setSelectedChartType(btn.type)}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm transition-colors',
                    selectedChartType === btn.type
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  title={btn.label}
                >
                  <span>{btn.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="w-full h-[400px]" />
          
          {/* 統計サマリー */}
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">総投票数</div>
              <div className="text-xl font-bold">{totalVotes}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">選択肢数</div>
              <div className="text-xl font-bold">{options.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">最多得票</div>
              <div className="text-xl font-bold">{topOptions[0]?.voteCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">競争率</div>
              <div className="text-xl font-bold">
                {topOptions[0] && topOptions[1] 
                  ? `${(topOptions[0].voteCount / Math.max(topOptions[1].voteCount, 1)).toFixed(1)}x`
                  : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アニメーション再生ボタン */}
      {showAnimation && (
        <div className="text-center">
          <button
            onClick={() => {
              setAnimationPlayed(false);
              setTimeout(() => setAnimationPlayed(true), 100);
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            アニメーション再生
          </button>
        </div>
      )}
    </div>
  );
}