'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { motion, AnimatePresence } from 'framer-motion';
import { DemographicData } from '@/types/poll';
import { 
  Users, 
  MapPin, 
  Calendar, 
  UserCheck,
  ChevronRight,
  Map,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { japanGeoData, prefectureCodeToName } from '@/lib/japan-map-data';

interface DemographicBreakdownProps {
  demographicData: DemographicData;
  className?: string;
  showAnimation?: boolean;
}

// 性別アイコンと色
const GENDER_CONFIG = {
  male: { label: '男性', icon: '👨', color: '#3b82f6' },
  female: { label: '女性', icon: '👩', color: '#ec4899' },
  other: { label: 'その他', icon: '🧑', color: '#8b5cf6' },
  unknown: { label: '未回答', icon: '❓', color: '#9ca3af' },
};

// 年齢別の色
const AGE_COLORS = [
  '#dbeafe', // 10代以下
  '#bfdbfe', // 20代
  '#93c5fd', // 30代
  '#60a5fa', // 40代
  '#3b82f6', // 50代
  '#2563eb', // 60代
  '#1d4ed8', // 70代以上
];

export function DemographicBreakdown({
  demographicData,
  className,
  showAnimation = true,
}: DemographicBreakdownProps) {
  const [activeTab, setActiveTab] = useState<'prefecture' | 'age' | 'gender'>('prefecture');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  const mapChartRef = useRef<HTMLDivElement>(null);
  const ageChartRef = useRef<HTMLDivElement>(null);
  const genderChartRef = useRef<HTMLDivElement>(null);
  
  const mapChartInstance = useRef<echarts.ECharts | null>(null);
  const ageChartInstance = useRef<echarts.ECharts | null>(null);
  const genderChartInstance = useRef<echarts.ECharts | null>(null);

  // 都道府県別地図表示
  useEffect(() => {
    if (activeTab !== 'prefecture' || !mapChartRef.current) return;

    const initMapChart = async () => {
      try {
        // GeoJSONデータを読み込む
        const response = await fetch('/data/japan.json');
        const geoJson = await response.json();
        
        // EChartsに地図を登録
        echarts.registerMap('japan', geoJson);

        if (!mapChartInstance.current) {
          mapChartInstance.current = echarts.init(mapChartRef.current, undefined, {
            renderer: 'canvas',
          });
        }

        const chart = mapChartInstance.current;

        // 地図データの準備
        const mapData = demographicData.prefecture.distribution.map(pref => {
          const coords = japanGeoData[pref.prefectureName as keyof typeof japanGeoData];
          if (!coords) return null;

          return {
            name: pref.prefectureName,
            value: [...coords, pref.count],
            prefectureCode: pref.prefectureCode,
            count: pref.count,
            percentage: pref.percentage,
            dominantOption: pref.dominantOption,
            itemStyle: {
              color: `rgba(59, 130, 246, ${Math.min(pref.percentage / 10, 1)})`,
            },
          };
        }).filter(Boolean);

        const option: echarts.EChartsOption = {
          title: {
            text: '都道府県別投票分布',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              if (!params.data) return '';
              const data = params.data;
              return `
                <div style="padding: 8px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
                  <div>投票数: ${data.count}票 (${data.percentage.toFixed(1)}%)</div>
                  <div style="margin-top: 4px;">
                    <strong>最多選択:</strong><br/>
                    ${data.dominantOption.optionText} (${data.dominantOption.percentage.toFixed(1)}%)
                  </div>
                </div>
              `;
            },
          },
          geo: {
            map: 'japan',
            roam: true,
            zoom: 1.2,
            center: [137.0, 38.0],
            itemStyle: {
              areaColor: '#f3f4f6',
              borderColor: '#d1d5db',
              borderWidth: 1,
            },
            emphasis: {
              itemStyle: {
                areaColor: '#e5e7eb',
                borderColor: '#9ca3af',
                borderWidth: 2,
              },
              label: {
                show: true,
                color: '#1f2937',
                fontSize: 12,
                fontWeight: 'bold',
              },
            },
            select: {
              itemStyle: {
                areaColor: '#dbeafe',
                borderColor: '#3b82f6',
                borderWidth: 2,
              },
            },
            regions: mapData.map(d => ({
              name: d!.name,
              itemStyle: {
                areaColor: d!.itemStyle.color,
              },
            })),
          },
          series: [
            {
              name: '投票データ',
              type: 'scatter',
              coordinateSystem: 'geo',
              data: mapData,
              symbolSize: (val: any[]) => {
                return Math.max(Math.sqrt(val[2]) * 3, 10);
              },
              itemStyle: {
                color: '#3b82f6',
                opacity: 0.8,
              },
              emphasis: {
                scale: 1.5,
                itemStyle: {
                  color: '#2563eb',
                  shadowBlur: 10,
                  shadowColor: 'rgba(59, 130, 246, 0.5)',
                },
              },
            },
          ],
          visualMap: {
            min: 0,
            max: Math.max(...demographicData.prefecture.distribution.map(p => p.count)),
            calculable: true,
            inRange: {
              color: ['#dbeafe', '#3b82f6', '#1d4ed8'],
            },
            text: ['高', '低'],
            left: 'left',
            bottom: 'bottom',
          },
        };

        chart.setOption(option);

        // クリックイベント
        chart.on('click', (params: any) => {
          if (params.componentType === 'geo' || params.componentType === 'series') {
            const prefData = demographicData.prefecture.distribution.find(
              p => p.prefectureName === params.name
            );
            if (prefData) {
              setSelectedPrefecture(prefData.prefectureCode);
            }
          }
        });
      } catch (error) {
        console.error('地図の初期化に失敗しました:', error);
      }
    };

    initMapChart();

    const handleResize = () => {
      mapChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, demographicData.prefecture]);

  // 年齢別グラフ
  useEffect(() => {
    if (activeTab !== 'age' || !ageChartRef.current) return;

    if (!ageChartInstance.current) {
      ageChartInstance.current = echarts.init(ageChartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = ageChartInstance.current;

    const option: echarts.EChartsOption = {
      title: {
        text: '年齢別投票分布',
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
          type: 'shadow',
        },
      },
      legend: {
        data: demographicData.age.ranges[0]?.optionBreakdown.map(opt => opt.optionText) || [],
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
        data: demographicData.age.ranges.map(r => r.range),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}票',
        },
      },
      series: demographicData.age.ranges[0]?.optionBreakdown.map((_, optIndex) => ({
        name: demographicData.age.ranges[0].optionBreakdown[optIndex].optionText,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series',
        },
        data: demographicData.age.ranges.map(range => 
          range.optionBreakdown[optIndex]?.count || 0
        ),
        itemStyle: {
          color: AGE_COLORS[optIndex % AGE_COLORS.length],
        },
      })) || [],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, demographicData.age]);

  // 性別グラフ
  useEffect(() => {
    if (activeTab !== 'gender' || !genderChartRef.current) return;

    if (!genderChartInstance.current) {
      genderChartInstance.current = echarts.init(genderChartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = genderChartInstance.current;

    const option: echarts.EChartsOption = {
      title: {
        text: '性別投票分布',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}票 ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        data: demographicData.gender.distribution.map(g => 
          GENDER_CONFIG[g.gender].label
        ),
      },
      series: [
        {
          name: '性別',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
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
          data: demographicData.gender.distribution.map(g => ({
            value: g.count,
            name: GENDER_CONFIG[g.gender].label,
            itemStyle: {
              color: GENDER_CONFIG[g.gender].color,
            },
          })),
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
  }, [activeTab, demographicData.gender]);

  // 選択された都道府県の詳細情報
  const selectedPrefData = demographicData.prefecture.distribution.find(
    p => p.prefectureCode === selectedPrefecture
  );

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              投票者属性分析
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                総投票者: {demographicData.prefecture.distribution.reduce((sum, p) => sum + p.count, 0)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="prefecture" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                都道府県別
              </TabsTrigger>
              <TabsTrigger value="age" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                年齢別
              </TabsTrigger>
              <TabsTrigger value="gender" className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                性別
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prefecture" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">
                        <div className="flex items-center gap-1">
                          <Map className="h-4 w-4" />
                          地図表示
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          一覧表示
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {viewMode === 'chart' ? (
                <div>
                  <div ref={mapChartRef} className="w-full h-[500px]" />
                  
                  {selectedPrefData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <h4 className="font-bold text-lg mb-2">
                        {selectedPrefData.prefectureName}の詳細
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">投票数</div>
                          <div className="text-xl font-bold">{selectedPrefData.count}票</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">全体比</div>
                          <div className="text-xl font-bold">{selectedPrefData.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-2">選択肢別分布</div>
                        <div className="space-y-2">
                          {selectedPrefData.optionBreakdown.map(opt => (
                            <div key={opt.optionId} className="flex items-center justify-between">
                              <span className="text-sm">{opt.optionText}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${opt.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 w-12 text-right">
                                  {opt.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">都道府県</th>
                        <th className="p-2 text-right">投票数</th>
                        <th className="p-2 text-right">割合</th>
                        <th className="p-2 text-left">最多選択</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demographicData.prefecture.distribution
                        .sort((a, b) => b.count - a.count)
                        .map((pref, index) => (
                          <motion.tr
                            key={pref.prefectureCode}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedPrefecture(pref.prefectureCode)}
                          >
                            <td className="p-2">{pref.prefectureName}</td>
                            <td className="p-2 text-right font-mono">{pref.count}</td>
                            <td className="p-2 text-right font-mono">{pref.percentage.toFixed(1)}%</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {pref.dominantOption.optionText}
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="age" className="space-y-4">
              <div ref={ageChartRef} className="w-full h-[400px]" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {demographicData.age.ranges.map((range, index) => (
                  <motion.div
                    key={range.range}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-sm text-gray-600">{range.range}</div>
                    <div className="text-xl font-bold">{range.count}票</div>
                    <div className="text-xs text-gray-500">{range.percentage.toFixed(1)}%</div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gender" className="space-y-4">
              <div ref={genderChartRef} className="w-full h-[400px]" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {demographicData.gender.distribution.map((gender, index) => (
                  <motion.div
                    key={gender.gender}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-center"
                  >
                    <div className="text-4xl mb-2">{GENDER_CONFIG[gender.gender].icon}</div>
                    <div className="text-sm text-gray-600">{GENDER_CONFIG[gender.gender].label}</div>
                    <div className="text-xl font-bold">{gender.count}</div>
                    <div className="text-xs text-gray-500">{gender.percentage.toFixed(1)}%</div>
                  </motion.div>
                ))}
              </div>

              {/* 性別ごとの選択肢分布 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">性別ごとの選択傾向</h4>
                {demographicData.gender.distribution.map(gender => (
                  <div key={gender.gender} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{GENDER_CONFIG[gender.gender].icon}</span>
                      <span className="font-medium">{GENDER_CONFIG[gender.gender].label}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {gender.optionBreakdown.map(opt => (
                        <div
                          key={opt.optionId}
                          className="p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="text-xs text-gray-600 truncate">{opt.optionText}</div>
                          <div className="font-bold">{opt.percentage.toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}