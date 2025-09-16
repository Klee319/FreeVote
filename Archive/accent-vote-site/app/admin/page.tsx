'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown,
  Vote,
  BookOpen
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import PollsManagementContent from '@/components/admin/PollsManagementContent';
import AccentWordsManagementContent from '@/components/admin/AccentWordsManagementContent';

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
  const [activeTab, setActiveTab] = useState('polls');

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
        <p className="text-gray-600 mt-2">投票管理と統計情報</p>
      </div>

      {/* 全体統計カード */}
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

      {/* タブによる機能管理 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="polls" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            汎用投票管理
          </TabsTrigger>
          <TabsTrigger value="accent" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            アクセント投票管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="polls" className="space-y-4">
          <PollsManagementContent />
        </TabsContent>

        <TabsContent value="accent" className="space-y-4">
          <AccentWordsManagementContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}