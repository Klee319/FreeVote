'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  TrendingUp,
  Trophy,
  Clock,
  Calendar,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PollStatisticsData } from '@/types/poll';
import { formatNumber } from '@/lib/utils';

interface PollStatisticsProps {
  statistics: PollStatisticsData;
  onRefresh?: () => Promise<void>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'text-primary-600',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-2xl font-bold', color)}>
                  {typeof value === 'number' ? formatNumber(value) : value}
                </p>
                {trend !== undefined && (
                  <Badge
                    variant={trend > 0 ? 'default' : trend < 0 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {trend > 0 ? '+' : ''}{trend}%
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div className={cn('p-3 rounded-lg bg-opacity-10', `bg-${color}`)}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function PollStatistics({
  statistics,
  onRefresh,
  autoRefresh = false,
  refreshInterval = 30000, // 30秒
  className,
}: PollStatisticsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(autoRefresh);

  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(async () => {
      if (isLive) {
        await handleRefresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLive, onRefresh]);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('統計情報の更新に失敗しました:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // 時間別投票データの最大値を取得
  const maxHourlyVotes = Math.max(...statistics.hourlyVotes.map((h) => h.count), 1);

  return (
    <div className={cn('space-y-6', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">投票統計</h2>
          {isLive && (
            <Badge variant="default" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            最終更新: {formatTime(lastUpdated)}
          </span>
          {onRefresh && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              </Button>
              {autoRefresh && (
                <Button
                  variant={isLive ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleLive}
                >
                  {isLive ? 'ライブ停止' : 'ライブ開始'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="総投票数"
          value={statistics.totalVotes}
          icon={BarChart3}
          description="累計投票数"
          color="text-blue-600"
        />
        <StatCard
          title="参加者数"
          value={statistics.uniqueVoters}
          icon={Users}
          description="ユニークユーザー数"
          color="text-green-600"
        />
        <StatCard
          title="最多得票"
          value={statistics.topOption.text}
          icon={Trophy}
          description={`${formatNumber(statistics.topOption.voteCount)}票 (${statistics.topOption.percentage.toFixed(1)}%)`}
          color="text-yellow-600"
        />
      </div>

      {/* 時間別投票グラフ */}
      {statistics.hourlyVotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              時間別投票数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.hourlyVotes.slice(-24).map((hourData, index) => (
                <motion.div
                  key={hourData.hour}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground w-12">
                    {hourData.hour}
                  </span>
                  <div className="flex-1">
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <motion.div
                          className="h-6 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-end px-2"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(hourData.count / maxHourlyVotes) * 100}%`,
                          }}
                          transition={{ duration: 0.5, delay: index * 0.02 }}
                        >
                          {hourData.count > 0 && (
                            <span className="text-xs text-white font-medium">
                              {formatNumber(hourData.count)}
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日別投票グラフ */}
      {statistics.dailyVotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              日別投票数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {statistics.dailyVotes.slice(-7).map((dayData, index) => {
                const percentage = (dayData.count / Math.max(...statistics.dailyVotes.map((d) => d.count), 1)) * 100;
                return (
                  <motion.div
                    key={dayData.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-center"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(dayData.date).toLocaleDateString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="relative h-24 flex items-end justify-center">
                        <motion.div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md"
                          initial={{ height: 0 }}
                          animate={{ height: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        />
                      </div>
                      <p className="text-xs font-medium">
                        {formatNumber(dayData.count)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* リアルタイム更新インジケーター */}
      {isLive && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center p-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="relative">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-ping absolute" />
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              </div>
              <span>リアルタイム更新中（{refreshInterval / 1000}秒ごと）</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}