'use client';

import { useEffect, useRef, useMemo } from 'react';
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

  // 地図データの準備
  const mapData = useMemo(() => {
    return prefectureStats.map((stat) => {
      const prefName = prefectureCodeToName[stat.prefectureCode];
      const coords = japanGeoData[prefName as keyof typeof japanGeoData];
      
      if (!coords) return null;

      // 最多アクセント型の色を取得
      const dominantColor = getAccentTypeColor(stat.dominantAccent);
      
      // 投票数に応じたサイズ（最小10、最大50）
      const maxVotes = Math.max(...prefectureStats.map(s => s.totalVotes));
      const minVotes = Math.min(...prefectureStats.map(s => s.totalVotes));
      const normalizedSize = minVotes === maxVotes 
        ? 25 
        : 10 + ((stat.totalVotes - minVotes) / (maxVotes - minVotes)) * 40;

      return {
        name: prefName,
        value: [...coords, stat.totalVotes],
        prefectureCode: stat.prefectureCode,
        dominantAccent: stat.dominantAccent,
        totalVotes: stat.totalVotes,
        accentDistribution: stat.accentDistribution,
        itemStyle: {
          color: dominantColor,
          opacity: 0.8,
        },
        symbolSize: normalizedSize,
        selected: stat.prefectureCode === selectedPrefecture,
      };
    }).filter(Boolean);
  }, [prefectureStats, selectedPrefecture]);

  // チャート初期化と更新
  useEffect(() => {
    if (!chartRef.current) return;

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
      grid: {
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (!params.data) return '';
          
          const data = params.data;
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
        roam: false,
        silent: true,
        itemStyle: {
          areaColor: '#ffffff',
          borderColor: '#d1d5db',
          borderWidth: 1,
        },
        emphasis: {
          disabled: true,
        },
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '10%',
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: mapData,
          symbolSize: function(val: any[]) {
            return mapData.find(d => d && d.value[0] === val[0] && d.value[1] === val[1])?.symbolSize || 20;
          },
          label: {
            show: true,
            formatter: function(params: any) {
              const prefCode = params.data?.prefectureCode;
              if (!prefCode) return '';
              
              // 都道府県名を短縮表示（"県"を省略）
              const name = params.data.name;
              return name.replace(/県$/, '').replace(/東京都/, '東京').replace(/大阪府/, '大阪').replace(/京都府/, '京都');
            },
            position: 'bottom',
            fontSize: 10,
            color: '#4b5563',
          },
          emphasis: {
            scale: 1.3,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#1f2937',
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
            label: {
              fontWeight: 'bold',
              fontSize: 12,
            },
          },
        },
      ],
      // 凡例を追加
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        data: ['頭高型', '中高型', '尾高型', '平板型'].map(name => ({
          name,
          icon: 'circle',
        })),
        textStyle: {
          fontSize: 12,
        },
        formatter: function(name: string) {
          // アクセント型の説明を追加
          const descriptions: { [key: string]: string } = {
            '頭高型': '頭高型 (最初が高い)',
            '中高型': '中高型 (途中が高い)',
            '尾高型': '尾高型 (最後が高い)',
            '平板型': '平板型 (平らに発音)',
          };
          return descriptions[name] || name;
        },
      },
    };

    // 日本地図の登録（簡易版）
    echarts.registerMap('japan', {
      type: 'FeatureCollection',
      features: Object.entries(japanGeoData).map(([name, coords]) => ({
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      })),
    } as any);

    chart.setOption(option);

    // クリックイベントの設定
    chart.off('click');
    chart.on('click', 'series', function(params: any) {
      if (params.data && params.data.prefectureCode) {
        onPrefectureSelect?.(params.data.prefectureCode);
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
  }, [mapData, onPrefectureSelect]);

  // 選択された都道府県のハイライト
  useEffect(() => {
    if (!chartInstance.current || !selectedPrefecture) return;

    const chart = chartInstance.current;
    const dataIndex = mapData.findIndex(d => d?.prefectureCode === selectedPrefecture);
    
    if (dataIndex >= 0) {
      chart.dispatchAction({
        type: 'select',
        seriesIndex: 0,
        dataIndex,
      });
    }
  }, [selectedPrefecture, mapData]);

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
          ※ 円の大きさは投票数を、色は最多アクセント型を表しています
        </p>
      </div>
    </div>
  );
}