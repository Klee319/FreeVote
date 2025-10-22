'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Clock, CheckCircle2 } from 'lucide-react';
import { Poll } from '@/types';

interface DetailAccessPromptProps {
  poll: Poll;
  expiresAt?: string;
  onShare: () => void;
}

export function DetailAccessPrompt({
  poll,
  expiresAt,
  onShare,
}: DetailAccessPromptProps) {
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRemainingDays = (dateString: string) => {
    const now = new Date();
    const expiry = new Date(dateString);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (expiresAt) {
    const remainingDays = getRemainingDays(expiresAt);

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold">詳細統計を閲覧できます</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Clock className="h-4 w-4" />
              <span>
                あと{remainingDays}日間利用可能（{formatExpiryDate(expiresAt)}まで）
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              シェアありがとうございます！年代別・性別・地域別の詳細統計をご覧いただけます。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <h3 className="font-semibold text-blue-900">詳細統計を見るには</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-blue-800">
            この投票をSNSでシェアすると、詳細な統計データを
            <span className="font-bold text-blue-900">7日間</span>
            閲覧できます
          </p>
          <div className="bg-white rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-blue-900">閲覧できる詳細統計：</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>年代別の投票傾向</li>
              <li>性別の投票分布</li>
              <li>都道府県別の投票結果</li>
              <li>グラフによる可視化</li>
            </ul>
          </div>
        </div>
        <Button
          onClick={onShare}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Share2 className="h-4 w-4 mr-2" />
          シェアして詳細統計を見る
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Twitter、Facebook、LINEなどでシェアできます
        </p>
      </CardContent>
    </Card>
  );
}
