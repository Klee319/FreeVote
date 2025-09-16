'use client';

import React from 'react';
import { 
  Settings, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { accentColors } from '@/lib/japanMapData';

interface MapControlsProps {
  selectedAccentType: string | null;
  onAccentTypeChange: (type: string | null) => void;
  showPercentage: boolean;
  onShowPercentageChange: (show: boolean) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onReset: () => void;
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({
  selectedAccentType,
  onAccentTypeChange,
  showPercentage,
  onShowPercentageChange,
  zoomLevel,
  onZoomChange,
  onReset,
  className = ''
}) => {
  const handleZoomIn = () => {
    const newLevel = Math.min(zoomLevel + 0.2, 3);
    onZoomChange(newLevel);
  };

  const handleZoomOut = () => {
    const newLevel = Math.max(zoomLevel - 0.2, 0.5);
    onZoomChange(newLevel);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          地図コントロール
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          リセット
        </Button>
      </div>

      <Accordion type="single" collapsible defaultValue="filter" className="w-full">
        {/* フィルター */}
        <AccordionItem value="filter">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              フィルター
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="accent-filter" className="text-xs">
                アクセントタイプで絞り込み
              </Label>
              <Select 
                value={selectedAccentType || 'all'} 
                onValueChange={(value) => onAccentTypeChange(value === 'all' ? null : value)}
              >
                <SelectTrigger id="accent-filter" className="w-full h-8 text-xs">
                  <SelectValue placeholder="すべて表示" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて表示</SelectItem>
                  {Object.keys(accentColors)
                    .filter(type => type !== 'データ不足')
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: accentColors[type as keyof typeof accentColors] }}
                          />
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ズーム */}
        <AccordionItem value="zoom">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              ズーム
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="zoom-slider" className="text-xs">
                  ズームレベル
                </Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Slider
                  id="zoom-slider"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={[zoomLevel]}
                  onValueChange={([value]) => onZoomChange(value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 表示設定 */}
        <AccordionItem value="display">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              表示設定
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-percentage" className="text-xs flex items-center gap-2">
                <Percent className="h-3 w-3" />
                パーセンテージ表示
              </Label>
              <Switch
                id="show-percentage"
                checked={showPercentage}
                onCheckedChange={onShowPercentageChange}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* クイックアクション */}
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground mb-2">クイックアクション</p>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => onZoomChange(1)}
          >
            標準表示
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => onZoomChange(1.5)}
          >
            拡大表示
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapControls;