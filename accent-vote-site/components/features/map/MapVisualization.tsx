'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  VisualMapComponent,
  GeoComponent 
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { prefectures, accentColors, prefectureCoordinates } from '@/lib/japanMapData';

// EChartsの必要なコンポーネントを登録
echarts.use([
  MapChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
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

  useEffect(() => {
    if (!chartRef.current) return;

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

    // 散布図データの準備（都道府県ごとの点）
    const scatterData = prefectures.map(pref => {
      const coords = prefectureCoordinates[pref.name as keyof typeof prefectureCoordinates];
      const accentInfo = prefectureAccentMap.get(pref.name);
      
      return {
        name: pref.name,
        value: coords ? [...coords, accentInfo?.count || 0] : [0, 0, 0],
        accentType: accentInfo?.type || 'データ不足',
        percentage: accentInfo?.percentage || 0,
        itemStyle: {
          color: accentColors[accentInfo?.type as keyof typeof accentColors] || accentColors['データ不足']
        }
      };
    });

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const data = params.data;
          if (data) {
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
        }
      },
      geo: {
        map: 'japan',
        roam: true,
        zoom: 1.2,
        center: [138, 38],
        itemStyle: {
          borderColor: '#ddd',
          borderWidth: 1,
          areaColor: '#f9f9f9'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#e0e0e0'
          }
        }
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: function (val: number[]) {
            // 投票数に応じて点のサイズを調整
            const size = Math.max(10, Math.min(40, val[2] / 10));
            return size;
          },
          label: {
            show: true,
            formatter: '{b}',
            position: 'bottom',
            fontSize: 10
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    // 日本地図のGeoJSONをセット（簡易版）
    const japanGeoJson = {
      type: 'FeatureCollection',
      features: prefectures.map(pref => ({
        type: 'Feature',
        properties: {
          name: pref.name
        },
        geometry: {
          type: 'Point',
          coordinates: prefectureCoordinates[pref.name as keyof typeof prefectureCoordinates] || [0, 0]
        }
      }))
    };

    echarts.registerMap('japan', japanGeoJson as any);
    myChart.setOption(option);

    // イベントハンドラの設定
    myChart.on('click', function(params) {
      if (params.data && onPrefectureClick) {
        onPrefectureClick(params.data.name);
      }
    });

    myChart.on('mouseover', function(params) {
      if (params.data) {
        setHoveredPrefecture(params.data.name);
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
  }, [data, onPrefectureClick, title]);

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