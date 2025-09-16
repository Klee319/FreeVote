'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MapVisualization, { AccentData } from './MapVisualization';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin } from 'lucide-react';

interface PrefectureVoteData {
  prefecture: string;
  votes: {
    accentType: string;
    count: number;
    percentage: number;
  }[];
  totalVotes: number;
}

interface AccentMapContainerProps {
  className?: string;
}

const AccentMapContainer: React.FC<AccentMapContainerProps> = ({ className = '' }) => {
  const router = useRouter();
  const [mapData, setMapData] = useState<AccentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccentType, setSelectedAccentType] = useState<string | null>(null);
  const [showPercentage, setShowPercentage] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // データ取得
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/statistics/prefecture', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data: PrefectureVoteData[] = await response.json();
      
      // データを変換
      const transformedData: AccentData[] = [];
      data.forEach((prefData) => {
        if (prefData.votes && prefData.votes.length > 0) {
          // 最も投票数が多いアクセントタイプを取得
          const topVote = prefData.votes.reduce((prev, current) => 
            prev.count > current.count ? prev : current
          );
          
          transformedData.push({
            prefecture: prefData.prefecture,
            accentType: topVote.accentType,
            count: topVote.count,
            percentage: topVote.percentage
          });
        } else {
          // データがない場合
          transformedData.push({
            prefecture: prefData.prefecture,
            accentType: 'データ不足',
            count: 0,
            percentage: 0
          });
        }
      });

      setMapData(transformedData);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err instanceof Error ? err.message : '地図データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // 都道府県クリック時の処理
  const handlePrefectureClick = useCallback((prefecture: string) => {
    // 都道府県詳細ページへ遷移
    router.push(`/statistics/prefecture/${encodeURIComponent(prefecture)}`);
  }, [router]);

  // アクセントタイプフィルター
  const filteredData = selectedAccentType
    ? mapData.filter(d => d.accentType === selectedAccentType)
    : mapData;

  // リセット処理
  const handleReset = () => {
    setSelectedAccentType(null);
    setShowPercentage(true);
    setZoomLevel(1);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">地図データを読み込んでいます...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <button 
                onClick={fetchMapData}
                className="ml-2 underline hover:no-underline"
              >
                再試行
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          日本のアクセント分布地図
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* 地図表示エリア */}
          <div className="flex-1 relative">
            <MapVisualization
              data={filteredData}
              onPrefectureClick={handlePrefectureClick}
              showLegend={false}
              title=""
            />
          </div>

          {/* サイドバー */}
          <div className="lg:w-80 p-4 border-t lg:border-t-0 lg:border-l">
            {/* コントロール */}
            <div className="mb-6">
              <MapControls
                selectedAccentType={selectedAccentType}
                onAccentTypeChange={setSelectedAccentType}
                showPercentage={showPercentage}
                onShowPercentageChange={setShowPercentage}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onReset={handleReset}
              />
            </div>

            {/* 凡例 */}
            <div className="mb-6">
              <MapLegend />
            </div>

            {/* 統計情報 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">統計情報</h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>総投票数: {mapData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}</p>
                <p>データ有効都道府県: {mapData.filter(d => d.count > 0).length}/47</p>
              </div>
            </div>

            {/* 使い方 */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-2">使い方</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 都道府県をクリックすると詳細を表示</li>
                <li>• マウスホバーで投票統計を確認</li>
                <li>• ドラッグで地図を移動</li>
                <li>• スクロールでズーム調整</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccentMapContainer;