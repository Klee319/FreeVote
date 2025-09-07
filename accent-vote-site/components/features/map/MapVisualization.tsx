'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { MapChart, ScatterChart } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  VisualMapComponent,
  GeoComponent,
  LegendComponent 
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { prefectures, accentColors, prefectureCoordinates } from '@/lib/japanMapData';

// EChartsの必要なコンポーネントを登録
echarts.use([
  MapChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  LegendComponent,
  CanvasRenderer
]);

export interface AccentData {
  prefecture: string;
  accentType: string;
  count: number;
  percentage: number;
}

interface MapVisualizationProps {
  data: AccentData[];
  onPrefectureClick?: (prefecture: string) => void;
  showLegend?: boolean;
  title?: string;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  data,
  onPrefectureClick,
  showLegend = true,
  title = '日本のアクセント分布地図'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegistered, setMapRegistered] = useState(false);

  // GeoJSONデータの読み込みと地図の登録
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        
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
        
        // フォールバック: 簡易的な地図データを使用
        const fallbackGeoJson = {
          type: 'FeatureCollection',
          features: prefectures.map(pref => ({
            type: 'Feature',
            properties: { 
              name: pref.name,
              id: pref.code.toString().padStart(2, '0')
            },
            geometry: {
              type: 'Point',
              coordinates: prefectureCoordinates[pref.name as keyof typeof prefectureCoordinates] || [0, 0]
            }
          }))
        };
        echarts.registerMap('japan', fallbackGeoJson as any);
        setMapRegistered(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  useEffect(() => {
    if (!chartRef.current || !mapRegistered) return;

    const myChart = echarts.init(chartRef.current);
    setChartInstance(myChart);

    // 都道府県ごとの最多アクセントタイプを計算
    const prefectureAccentMap = new Map<string, { type: string; count: number; percentage: number }>();
    
    data.forEach((item) => {
      const existing = prefectureAccentMap.get(item.prefecture);
      if (!existing || existing.count < item.count) {
        prefectureAccentMap.set(item.prefecture, {
          type: item.accentType,
          count: item.count,
          percentage: item.percentage
        });
      }
    });

    // 地図の地域別色分けデータ
    const regions = prefectures.map(pref => {
      const accentInfo = prefectureAccentMap.get(pref.name);
      return {
        name: pref.name,
        itemStyle: {
          areaColor: accentInfo 
            ? accentColors[accentInfo.type as keyof typeof accentColors] || accentColors['データ不足']
            : accentColors['データ不足'],
          opacity: accentInfo ? 0.8 : 0.3
        }
      };
    });

    // 散布図データの準備（都道府県ごとの点）
    const scatterData = prefectures.map(pref => {
      const coords = prefectureCoordinates[pref.name as keyof typeof prefectureCoordinates];
      const accentInfo = prefectureAccentMap.get(pref.name);
      
      if (!coords || !accentInfo || accentInfo.count === 0) {
        return null;
      }

      return {
        name: pref.name,
        value: [...coords, accentInfo.count],
        accentType: accentInfo.type,
        percentage: accentInfo.percentage,
        itemStyle: {
          color: accentColors[accentInfo.type as keyof typeof accentColors] || accentColors['データ不足']
        }
      };
    }).filter(Boolean);

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1f2937'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (params.componentType === 'geo') {
            const accentInfo = prefectureAccentMap.get(params.name);
            if (accentInfo && accentInfo.count > 0) {
              return `
                <div style="padding: 8px;">
                  <strong>${params.name}</strong><br/>
                  アクセントタイプ: ${accentInfo.type}<br/>
                  投票率: ${accentInfo.percentage.toFixed(1)}%<br/>
                  投票数: ${accentInfo.count}
                </div>
              `;
            } else {
              return `
                <div style="padding: 8px;">
                  <strong>${params.name}</strong><br/>
                  <span style="color: #6b7280;">まだ投票データがありません</span>
                </div>
              `;
            }
          } else if (params.data) {
            const data = params.data;
            return `
              <div style="padding: 8px;">
                <strong>${data.name}</strong><br/>
                アクセントタイプ: ${data.accentType}<br/>
                投票率: ${data.percentage.toFixed(1)}%<br/>
                投票数: ${data.value[2]}
              </div>
            `;
          }
          return '';
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#1f2937'
        }
      },
      geo: {
        map: 'japan',
        roam: true,
        zoom: 1.2,
        center: [137.0, 38.0],
        itemStyle: {
          borderColor: '#d1d5db',
          borderWidth: 1,
          areaColor: '#f9fafb'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#e5e7eb',
            borderColor: '#9ca3af',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#1f2937',
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        select: {
          itemStyle: {
            areaColor: '#dbeafe',
            borderColor: '#3b82f6',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#1e40af',
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        regions: regions
      },
      series: [
        {
          name: '投票データ',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: function (val: number[]) {
            // 投票数に応じて点のサイズを調整
            const maxCount = Math.max(...scatterData.map(d => d ? d.value[2] : 0));
            const minSize = 10;
            const maxSize = 40;
            if (maxCount === 0) return minSize;
            const size = minSize + (val[2] / maxCount) * (maxSize - minSize);
            return size;
          },
          label: {
            show: false
          },
          emphasis: {
            scale: 1.5,
            label: {
              show: true,
              formatter: '{b}',
              position: 'top',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#1f2937',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 2,
              borderRadius: 2
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        }
      ],
      legend: showLegend ? {
        orient: 'vertical',
        left: 10,
        top: 80,
        data: Object.keys(accentColors).filter(key => key !== 'データ不足').map(type => ({
          name: type,
          icon: 'circle',
          textStyle: {
            color: '#4b5563'
          }
        })),
        textStyle: {
          fontSize: 12
        },
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 8,
        selectedMode: false
      } : undefined
    };

    // 凡例データの設定
    if (option.legend && typeof option.legend === 'object' && !Array.isArray(option.legend)) {
      (option.legend as any).data = Object.keys(accentColors).filter(key => key !== 'データ不足').map(type => ({
        name: type,
        icon: 'circle',
        itemStyle: {
          color: accentColors[type as keyof typeof accentColors]
        }
      }));
    }

    myChart.setOption(option);

    // イベントハンドラの設定
    myChart.off('click');
    myChart.on('click', function(params) {
      if (params.componentType === 'geo') {
        // 地図上の都道府県をクリック
        if (onPrefectureClick && params.name) {
          onPrefectureClick(params.name);
        }
      } else if (params.componentType === 'series' && params.data) {
        // 散布図のポイントをクリック
        if (onPrefectureClick && typeof params.data === 'object' && params.data && 'name' in params.data) {
          onPrefectureClick((params.data as any).name);
        }
      }
    });

    myChart.on('mouseover', function(params) {
      if (params.componentType === 'geo' && params.name) {
        setHoveredPrefecture(params.name);
      } else if (params.data && typeof params.data === 'object' && 'name' in params.data) {
        setHoveredPrefecture((params.data as any).name);
      }
    });

    myChart.on('mouseout', function() {
      setHoveredPrefecture(null);
    });

    // ウィンドウサイズ変更時のリサイズ処理
    const handleResize = () => {
      myChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data, onPrefectureClick, title, showLegend, mapRegistered]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center">
        <div className="text-gray-500">地図データを読み込んでいます...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={chartRef} 
        className="w-full h-full min-h-[600px]"
      />
      
      {showLegend && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-sm font-bold mb-2">凡例</h3>
          <div className="space-y-1">
            {Object.entries(accentColors).map(([type, color]) => (
              <div key={type} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredPrefecture && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
          <span className="text-sm">{hoveredPrefecture}</span>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;