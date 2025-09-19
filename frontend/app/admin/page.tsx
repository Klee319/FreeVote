"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Vote,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// カテゴリーの色設定
const CATEGORY_COLORS: { [key: string]: string } = {
  エンタメ: "#8884d8",
  ニュース: "#82ca9d",
  アクセント: "#ffc658",
  雑学: "#ff7c7c",
  その他: "#8dd1e1",
  ユーザー提案: "#d084d0",
};

// ダッシュボードデータの型定義
interface DashboardStats {
  totalVotes: number;
  totalUsers: number;
  activePolls: number;
  pendingRequests: number;
  votesGrowth: number;
  usersGrowth: number;
  closingSoonPolls: number;
}

interface VotesTrendData {
  date: string;
  votes: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
}

interface RecentPoll {
  id: string;
  title: string;
  votes: number;
  status: string;
  deadline: string;
}

interface RecentRequest {
  id: string;
  title: string;
  likes: number;
  date: string;
}

interface DashboardData {
  stats: DashboardStats;
  votesTrend: VotesTrendData[];
  categoryDistribution: CategoryDistribution[];
  recentPolls: RecentPoll[];
  recentRequests: RecentRequest[];
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/dashboard/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 mb-4 animate-spin text-blue-500" />
        <div className="text-lg text-gray-500">ダッシュボードを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8">ダッシュボード</h2>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button
              onClick={fetchDashboardData}
              className="ml-2 text-blue-500 hover:underline"
            >
              再試行
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8">ダッシュボード</h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            データが見つかりません。
            <button
              onClick={fetchDashboardData}
              className="ml-2 text-blue-500 hover:underline"
            >
              再読み込み
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { stats, votesTrend, categoryDistribution, recentPolls, recentRequests } = dashboardData;

  // カテゴリーに色を追加
  const categoryDistributionWithColors = categoryDistribution.map((item) => ({
    ...item,
    color: CATEGORY_COLORS[item.name] || "#cccccc",
  }));

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">ダッシュボード</h2>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">総投票数</p>
              <p className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</p>
              <p
                className={`text-sm flex items-center mt-1 ${
                  stats.votesGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.votesGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {stats.votesGrowth >= 0 ? "+" : ""}{stats.votesGrowth}%
              </p>
            </div>
            <Vote className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">総ユーザー数</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p
                className={`text-sm flex items-center mt-1 ${
                  stats.usersGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.usersGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {stats.usersGrowth >= 0 ? "+" : ""}{stats.usersGrowth}%
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">実施中の投票</p>
              <p className="text-2xl font-bold">{stats.activePolls}</p>
              <p className="text-sm text-gray-500 mt-1">
                締切間近: {stats.closingSoonPolls}件
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">未処理リクエスト</p>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              {stats.pendingRequests > 0 && (
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  要確認
                </p>
              )}
            </div>
            <FileText className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 投票数推移 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">投票数推移（過去7日間）</h3>
          {votesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={votesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="votes"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              データがありません
            </div>
          )}
        </Card>

        {/* カテゴリー分布 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">カテゴリー別投票分布</h3>
          {categoryDistributionWithColors.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistributionWithColors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistributionWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              データがありません
            </div>
          )}
        </Card>
      </div>

      {/* 最近の活動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近の投票 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近の投票</h3>
          {recentPolls.length > 0 ? (
            <div className="space-y-3">
              {recentPolls.map((poll) => (
                <div
                  key={poll.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{poll.title}</p>
                    <p className="text-sm text-gray-500">
                      {poll.votes}票 • 締切: {poll.deadline}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                    実施中
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              実施中の投票がありません
            </div>
          )}
        </Card>

        {/* 最近のリクエスト */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近のリクエスト</h3>
          {recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-gray-500">
                      {request.likes}いいね • {request.date}
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                    確認
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              新しいリクエストがありません
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}