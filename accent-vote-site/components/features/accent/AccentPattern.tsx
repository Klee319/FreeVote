'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AccentPatternProps {
  pattern: number[];
  moraSegments: string[];
  dropPosition?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function AccentPattern({
  pattern,
  moraSegments,
  dropPosition,
  className,
  size = 'md',
  animated = false,
}: AccentPatternProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const sizes = {
    sm: { width: 200, height: 60, fontSize: 12 },
    md: { width: 280, height: 80, fontSize: 14 },
    lg: { width: 360, height: 100, fontSize: 16 },
  };

  const currentSize = sizes[size];
  const moraWidth = currentSize.width / moraSegments.length;

  useEffect(() => {
    if (!svgRef.current) return;

    // SVGアニメーション用のクラス追加
    if (animated) {
      const path = svgRef.current.querySelector('.accent-line');
      if (path) {
        path.classList.add('accent-line-animation');
      }
    }
  }, [animated]);

  // アクセント線の座標を計算
  const linePoints = pattern.map((level, index) => {
    const x = index * moraWidth + moraWidth / 2;
    const y = level === 1 ? currentSize.height * 0.25 : currentSize.height * 0.6;
    return { x, y };
  });

  // パスデータの生成
  const pathData = linePoints
    .map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className={cn('bg-gray-50 rounded-lg p-3', className)}>
      <svg
        ref={svgRef}
        width="100%"
        height={currentSize.height}
        viewBox={`0 0 ${currentSize.width} ${currentSize.height}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* グリッドライン（薄い） */}
        <line
          x1="0"
          y1={currentSize.height * 0.25}
          x2={currentSize.width}
          y2={currentSize.height * 0.25}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1="0"
          y1={currentSize.height * 0.6}
          x2={currentSize.width}
          y2={currentSize.height * 0.6}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* アクセント線 */}
        <path
          className="accent-line"
          d={pathData}
          stroke="#3b82f6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* アクセント点 */}
        {linePoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* 下がり目マーク */}
        {dropPosition && dropPosition <= pattern.length && (
          <text
            x={(dropPosition - 1) * moraWidth + moraWidth}
            y={currentSize.height * 0.15}
            textAnchor="middle"
            className="fill-red-600 font-bold"
            fontSize={currentSize.fontSize + 2}
          >
            ↓
          </text>
        )}

        {/* モーラテキスト */}
        {moraSegments.map((mora, index) => (
          <text
            key={index}
            x={index * moraWidth + moraWidth / 2}
            y={currentSize.height - 10}
            textAnchor="middle"
            className="fill-gray-700 font-medium"
            fontSize={currentSize.fontSize}
          >
            {mora}
          </text>
        ))}

        {/* 高低ラベル */}
        <text
          x={5}
          y={currentSize.height * 0.25 - 5}
          className="fill-gray-400"
          fontSize={10}
        >
          高
        </text>
        <text
          x={5}
          y={currentSize.height * 0.6 + 15}
          className="fill-gray-400"
          fontSize={10}
        >
          低
        </text>
      </svg>
    </div>
  );
}