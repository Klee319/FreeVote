'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatsOverview {
  totalWords: number;
  totalVotes: number;
  totalUsers: number;
  recentVotes: number;
  averageVotesPerWord: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats/overview', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-gray-600 mt-2">サイト全体の統計情報と管理機能</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              総単語数
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalWords) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              登録されている単語の総数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              総投票数
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalVotes) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              累計投票数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブユーザー
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalUsers) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              投票に参加したユーザー数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              24時間の投票数
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.recentVotes) : '-'}
            </div>
            <div className="flex items-center text-xs mt-1">
              {stats && stats.recentVotes > stats.averageVotesPerWord ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">平均より活発</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600">平均より低調</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クイックリンク */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">単語管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              単語の追加、編集、削除を管理
            </p>
            <a href="/admin/words" className="text-primary-600 hover:underline mt-2 inline-block">
              管理画面へ →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">投票統計</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              詳細な投票統計とレポート
            </p>
            <a href="/admin/stats" className="text-primary-600 hover:underline mt-2 inline-block">
              統計画面へ →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">データ管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              インポート・エクスポート機能
            </p>
            <a href="/admin/data" className="text-primary-600 hover:underline mt-2 inline-block">
              データ管理へ →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}