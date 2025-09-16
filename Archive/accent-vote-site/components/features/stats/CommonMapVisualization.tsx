'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { japanGeoData, prefectureCodeToName } from '@/lib/japan-map-data';

export interface MapDataItem {
  prefectureCode: string;
  name: string;
  topItem: string; // 各県の1位の内容
  topItemCount: number; // 1位の票数
  totalVotes: number;
  color?: string; // 表示色（オプション）
  percentage?: number; // 1位の割合
}

interface CommonMapVisualizationProps {
  data: MapDataItem[];
  selectedPrefecture?: string;
  onPrefectureSelect?: (prefecture: string) => void;
  title?: string;
  colorScheme?: 'gradient' | 'category'; // グラデーション or カテゴリ別色分け
  showLegend?: boolean;
}

export function CommonMapVisualization({
  data,
  selectedPrefecture,
  onPrefectureSelect,
  title = '都道府県別分布マップ',
  colorScheme = 'gradient',
  showLegend = true,
}: CommonMapVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegistered, setMapRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // カテゴリ色の生成
  const categoryColors = useMemo(() => {
    const uniqueItems = [...new Set(data.map(d => d.topItem))];
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
      '#6366f1', '#84cc16', '#06b6d4', '#a855f7'
    ];
    
    const colorMap: Record<string, string> = {};
    uniqueItems.forEach((item, index) => {
      colorMap[item] = colors[index % colors.length];
    });
    return colorMap;
  }, [data]);

  // 地図データの準備
  const mapData = useMemo(() => {
    const allPrefectures = Object.entries(prefectureCodeToName).map(([code, name]) => {
      const prefData = data.find(d => d.prefectureCode === code);
      const coords = japanGeoData[name as keyof typeof japanGeoData];
      
      if (!coords) return null;

      if (prefData) {
        const maxVotes = Math.max(...data.map(d => d.totalVotes), 1);
        const minVotes = Math.min(...data.map(d => d.totalVotes), 0);
        const normalizedSize = minVotes === maxVotes 
          ? 25 
          : 10 + ((prefData.totalVotes - minVotes) / (maxVotes - minVotes)) * 40;

        const itemColor = colorScheme === 'category' 
          ? (categoryColors[prefData.topItem] || '#e5e7eb')
          : (prefData.color || '#3b82f6');

        return {
          name,
          value: [...coords, prefData.totalVotes],
          prefectureCode: code,
          topItem: prefData.topItem,
          topItemCount: prefData.topItemCount,
          totalVotes: prefData.totalVotes,
          percentage: prefData.percentage || ((prefData.topItemCount / prefData.totalVotes) * 100),
          hasData: true,
          itemStyle: {
            color: itemColor,
            opacity: 0.8,
          },
          symbolSize: normalizedSize,
          selected: code === selectedPrefecture,
        };
      } else {
        return {
          name,
          value: [...coords, 0],
          prefectureCode: code,
          topItem: null,
          topItemCount: 0,
          totalVotes: 0,
          percentage: 0,
          hasData: false,
          itemStyle: {
            color: '#e5e7eb',
            opacity: 0.5,
          },
          symbolSize: 15,
          selected: code === selectedPrefecture,
        };
      }
    }).filter(Boolean);

    return allPrefectures;
  }, [data, selectedPrefecture, colorScheme, categoryColors]);

  // GeoJSONデータの読み込みと地図の登録
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/data/japan.json');
        if (!response.ok) {
          throw new Error('地図データの読み込みに失敗しました');
        }
        
        const geoJson = await response.json();
        echarts.registerMap('japan', geoJson);
        setMapRegistered(true);
      } catch (err) {
        console.error('地図データの読み込みエラー:', err);
        setError(err instanceof Error ? err.message : '地図データの読み込みに失敗しました');
        
        // フォールバック
        const fallbackGeoJson = {
          type: 'FeatureCollection',
          features: Object.entries(japanGeoData).map(([name, coords]) => ({
            type: 'Feature',
            properties: { name },
            geometry: {
              type: 'Point',
              coordinates: coords,
            },
          })),
        };
        echarts.registerMap('japan', fallbackGeoJson as any);
        setMapRegistered(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  // チャート初期化と更新
  useEffect(() => {
    if (!chartRef.current || !mapRegistered) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1f2937',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (!params.data) return '';
          
          const data = params.data;
          
          if (!data.hasData) {
            return `<div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
              <div style="color: #6b7280;">まだデータがありません</div>
            </div>`;
          }
          
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
            <div style="margin-bottom: 4px;">1位: ${data.topItem}</div>
            <div style="margin-bottom: 4px;">票数: ${data.topItemCount}票 (${data.percentage.toFixed(1)}%)</div>
            <div style="color: #6b7280;">総投票数: ${data.totalVotes}票</div>
          </div>`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#1f2937',
        },
      },
      geo: {
        map: 'japan',
        roam: true,
        zoom: 1.2,
        center: [137.0, 38.0],
        itemStyle: {
          areaColor: '#f9fafb',
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
          label: {
            show: true,
            color: '#1e40af',
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
        regions: mapData.filter(d => d?.hasData).map(d => ({
          name: d!.name,
          itemStyle: {
            areaColor: d!.itemStyle.color,
            opacity: 0.7,
          },
        })),
      },
      series: [
        {
          name: 'データ',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: mapData.filter(d => d?.hasData),
          symbolSize: function(val: any[]) {
            const data = mapData.find(d => d && d.value[0] === val[0] && d.value[1] === val[1]);
            return data?.symbolSize || 20;
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: 1.5,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
            label: {
              show: true,
              formatter: function(params: any) {
                return params.data?.topItem || '';
              },
              position: 'top',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#1f2937',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 2,
              borderRadius: 2,
            },
          },
          selectedMode: 'single',
          select: {
            itemStyle: {
              borderColor: '#3b82f6',
              borderWidth: 3,
              shadowBlur: 15,
              shadowColor: 'rgba(59, 130, 246, 0.4)',
            },
          },
        },
      ],
    };

    // カテゴリ別色分けの場合、凡例を追加
    if (showLegend && colorScheme === 'category') {
      const legendData = Object.entries(categoryColors).map(([item, color]) => ({
        name: item,
        icon: 'circle',
        itemStyle: { color },
      }));
      
      option.legend = {
        orient: 'vertical',
        left: 10,
        top: 80,
        data: legendData,
        textStyle: {
          fontSize: 12,
          color: '#4b5563',
        },
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 8,
        selectedMode: false,
      };
    }

    chart.setOption(option);

    // クリックイベントの設定
    chart.off('click');
    chart.on('click', function(params: any) {
      if (params.componentType === 'geo') {
        const clickedRegion = params.name;
        const prefCode = Object.entries(prefectureCodeToName).find(
          ([_, name]) => name === clickedRegion
        )?.[0];
        if (prefCode) {
          onPrefectureSelect?.(prefCode);
        }
      } else if (params.componentType === 'series' && params.data) {
        if (params.data.prefectureCode) {
          onPrefectureSelect?.(params.data.prefectureCode);
        }
      }
    });

    // ウィンドウリサイズ対応
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapData, mapRegistered, onPrefectureSelect, title, colorScheme, showLegend, categoryColors]);

  // 選択された都道府県のハイライト
  useEffect(() => {
    if (!chartInstance.current || !selectedPrefecture || !mapRegistered) return;

    const chart = chartInstance.current;
    const selectedName = prefectureCodeToName[selectedPrefecture];
    
    if (selectedName) {
      chart.dispatchAction({
        type: 'geoSelect',
        name: selectedName,
      });
      
      const dataIndex = mapData.findIndex(d => d?.prefectureCode === selectedPrefecture);
      if (dataIndex >= 0) {
        chart.dispatchAction({
          type: 'select',
          seriesIndex: 0,
          dataIndex,
        });
      }
    }
  }, [selectedPrefecture, mapData, mapRegistered]);

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-gray-500">地図データを読み込んでいます...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-red-500">エラー: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 rounded-lg p-4">
      <div ref={chartRef} className="w-full h-[400px] sm:h-[500px] md:h-[600px]" />
      
      {/* 説明 */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500">
          ※ 各都道府県の色は1位の項目を、濃さは投票数を表しています
        </p>
        {data.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            まだデータがありません。データが集まると地図上に表示されます。
          </p>
        )}
      </div>
    </div>
  );
}