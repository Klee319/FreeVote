"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Vote,
  Clock,
  AlertCircle,
  FileText,
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

// モックデータ
const statsData = {
  totalVotes: 15234,
  totalUsers: 3456,
  activePolls: 12,
  pendingRequests: 8,
  votesGrowth: 12.5,
  usersGrowth: 8.3,
};

const votesTrend = [
  { date: "1/1", votes: 1200 },
  { date: "1/2", votes: 1400 },
  { date: "1/3", votes: 1100 },
  { date: "1/4", votes: 1600 },
  { date: "1/5", votes: 1800 },
  { date: "1/6", votes: 2100 },
  { date: "1/7", votes: 2400 },
];

const categoryDistribution = [
  { name: "エンタメ", value: 35, color: "#8884d8" },
  { name: "ニュース", value: 25, color: "#82ca9d" },
  { name: "アクセント", value: 20, color: "#ffc658" },
  { name: "雑学", value: 15, color: "#ff7c7c" },
  { name: "その他", value: 5, color: "#8dd1e1" },
];

const recentPolls = [
  {
    id: 1,
    title: "好きなラーメンの種類は？",
    votes: 342,
    status: "active",
    deadline: "2025-01-20",
  },
  {
    id: 2,
    title: "冬の定番飲み物は？",
    votes: 256,
    status: "active",
    deadline: "2025-01-18",
  },
  {
    id: 3,
    title: "「雨」のアクセントは？",
    votes: 189,
    status: "active",
    deadline: "2025-01-22",
  },
];

const recentRequests = [
  {
    id: 1,
    title: "好きなアニメキャラクターは？",
    likes: 45,
    date: "2025-01-15",
  },
  {
    id: 2,
    title: "朝食に食べるものは？",
    likes: 32,
    date: "2025-01-14",
  },
  {
    id: 3,
    title: "勉強に集中する場所は？",
    likes: 28,
    date: "2025-01-14",
  },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データ取得のシミュレーション
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">ダッシュボード</h2>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">総投票数</p>
              <p className="text-2xl font-bold">{statsData.totalVotes.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{statsData.votesGrowth}%
              </p>
            </div>
            <Vote className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">総ユーザー数</p>
              <p className="text-2xl font-bold">{statsData.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{statsData.usersGrowth}%
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">実施中の投票</p>
              <p className="text-2xl font-bold">{statsData.activePolls}</p>
              <p className="text-sm text-gray-500 mt-1">
                締切間近: 3件
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">未処理リクエスト</p>
              <p className="text-2xl font-bold">{statsData.pendingRequests}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <AlertCircle className="w-4 h-4 mr-1" />
                要確認
              </p>
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
        </Card>

        {/* カテゴリー分布 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">カテゴリー別投票分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 最近の活動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近の投票 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近の投票</h3>
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
        </Card>

        {/* 最近のリクエスト */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近のリクエスト</h3>
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
        </Card>
      </div>
    </div>
  );
}