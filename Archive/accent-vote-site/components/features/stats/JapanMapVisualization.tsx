'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { PrefectureStat } from '@/types';
import { japanGeoData, prefectureCodeToName } from '@/lib/japan-map-data';
import { getAccentTypeColor, getAccentTypeName } from '@/lib/utils';

interface JapanMapVisualizationProps {
  prefectureStats: PrefectureStat[];
  selectedPrefecture?: string;
  onPrefectureSelect?: (prefecture: string) => void;
}

export function JapanMapVisualization({
  prefectureStats,
  selectedPrefecture,
  onPrefectureSelect,
}: JapanMapVisualizationProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegistered, setMapRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 地図データの準備
  const mapData = useMemo(() => {
    // すべての都道府県のデータを準備（データがない場合はデフォルト値）
    const allPrefectures = Object.entries(prefectureCodeToName).map(([code, name]) => {
      const stat = prefectureStats.find(s => s.prefectureCode === code);
      const coords = japanGeoData[name as keyof typeof japanGeoData];
      
      if (!coords) return null;

      if (stat) {
        // データがある場合
        const dominantColor = getAccentTypeColor(stat.dominantAccent);
        const maxVotes = Math.max(...prefectureStats.map(s => s.totalVotes), 1);
        const minVotes = Math.min(...prefectureStats.map(s => s.totalVotes), 0);
        const normalizedSize = minVotes === maxVotes 
          ? 25 
          : 10 + ((stat.totalVotes - minVotes) / (maxVotes - minVotes)) * 40;

        return {
          name,
          value: [...coords, stat.totalVotes],
          prefectureCode: code,
          dominantAccent: stat.dominantAccent,
          totalVotes: stat.totalVotes,
          accentDistribution: stat.accentDistribution,
          hasData: true,
          itemStyle: {
            color: dominantColor,
            opacity: 0.8,
          },
          symbolSize: normalizedSize,
          selected: code === selectedPrefecture,
        };
      } else {
        // データがない場合のデフォルト
        return {
          name,
          value: [...coords, 0],
          prefectureCode: code,
          dominantAccent: null,
          totalVotes: 0,
          accentDistribution: {},
          hasData: false,
          itemStyle: {
            color: '#e5e7eb', // グレー色
            opacity: 0.5,
          },
          symbolSize: 15,
          selected: code === selectedPrefecture,
        };
      }
    }).filter(Boolean);

    return allPrefectures;
  }, [prefectureStats, selectedPrefecture]);

  // GeoJSONデータの読み込みと地図の登録
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // GeoJSONデータを読み込む
        const response = await fetch('/data/japan.json');
        if (!response.ok) {
          throw new Error('地図データの読み込みに失敗しました');
        }
        
        const geoJson = await response.json();
        
        // EChartsに地図を登録
        echarts.registerMap('japan', geoJson);
        setMapRegistered(true);
      } catch (err) {
        console.error('地図データの読み込みエラー:', err);
        setError(err instanceof Error ? err.message : '地図データの読み込みに失敗しました');
        
        // フォールバック: 簡易的な地図データを使用
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

    // チャートインスタンスの初期化
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // チャートオプション設定
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: '都道府県別アクセント分布マップ',
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
          
          // データがない場合の表示
          if (!data.hasData) {
            return `<div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
              <div style="color: #6b7280;">まだ投票データがありません</div>
            </div>`;
          }
          
          const distribution = data.accentDistribution;
          
          let tooltipContent = `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
            <div style="margin-bottom: 4px;">総投票数: ${data.totalVotes}票</div>
            <div style="margin-bottom: 4px;">最多アクセント: ${getAccentTypeName(data.dominantAccent)}</div>
            <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">`;
          
          // アクセント分布の詳細
          Object.entries(distribution).forEach(([accentType, voteStat]: [string, any]) => {
            const color = getAccentTypeColor(accentType);
            tooltipContent += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: ${color}; margin-right: 8px; border-radius: 2px;"></div>
                <span>${getAccentTypeName(accentType)}: ${voteStat.count}票 (${voteStat.percentage.toFixed(1)}%)</span>
              </div>`;
          });
          
          tooltipContent += '</div></div>';
          return tooltipContent;
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
          name: '投票データ',
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
                return params.data?.name || '';
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
      // 凡例を追加
      legend: {
        orient: 'vertical',
        left: 10,
        top: 80,
        data: ['頭高型', '中高型', '尾高型', '平板型'].map(name => ({
          name,
          icon: 'circle',
          textStyle: {
            color: '#4b5563',
          },
        })),
        textStyle: {
          fontSize: 12,
        },
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 8,
        selectedMode: false,
      },
      visualMap: {
        show: false,
        min: 0,
        max: Math.max(...mapData.map(d => d?.totalVotes || 0), 100),
        calculable: true,
        inRange: {
          color: ['#e5e7eb', '#3b82f6'],
        },
      },
    };

    // 凡例データの設定
    const legendData = ['頭高型', '中高型', '尾高型', '平板型'].map(type => ({
      name: type,
      icon: 'circle',
      itemStyle: {
        color: getAccentTypeColor(type),
      },
    }));
    
    if (option.legend && typeof option.legend === 'object' && !Array.isArray(option.legend)) {
      option.legend.data = legendData;
    }

    chart.setOption(option);

    // クリックイベントの設定
    chart.off('click');
    chart.on('click', function(params: any) {
      if (params.componentType === 'geo') {
        // 地図上の都道府県をクリック
        const clickedRegion = params.name;
        const prefCode = Object.entries(prefectureCodeToName).find(
          ([_, name]) => name === clickedRegion
        )?.[0];
        if (prefCode) {
          onPrefectureSelect?.(prefCode);
        }
      } else if (params.componentType === 'series' && params.data) {
        // 散布図のポイントをクリック
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
  }, [mapData, mapRegistered, onPrefectureSelect]);

  // 選択された都道府県のハイライト
  useEffect(() => {
    if (!chartInstance.current || !selectedPrefecture || !mapRegistered) return;

    const chart = chartInstance.current;
    
    // 地図上の地域を選択
    const selectedName = prefectureCodeToName[selectedPrefecture];
    if (selectedName) {
      chart.dispatchAction({
        type: 'geoSelect',
        name: selectedName,
      });
      
      // 散布図のポイントも選択
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

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-gray-500">地図データを読み込んでいます...</div>
        </div>
      </div>
    );
  }

  // エラー状態の表示
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
      
      {/* アクセント型の凡例説明 */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">アクセント型について</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {['頭高型', '中高型', '尾高型', '平板型'].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getAccentTypeColor(type) }}
              />
              <span className="text-gray-600">{type}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          ※ 色の濃さは投票数を、色の種類は最多アクセント型を表しています
        </p>
        {prefectureStats.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            まだ投票データがありません。投票が行われると地図上に表示されます。
          </p>
        )}
      </div>
    </div>
  );
}