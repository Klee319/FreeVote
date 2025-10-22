"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import PollTable from "@/components/features/admin/PollTable";
import { Plus, Search } from "lucide-react";

interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voteCount: number;
  createdAt: string;
  deadline: string;
  isAccentMode: boolean;
}

// モックデータ
const mockPolls = [
  {
    id: "1",
    title: "好きなラーメンの種類は？",
    description: "日本人の国民食、ラーメンの好みを調査します",
    category: "グルメ",
    status: "active",
    voteCount: 342,
    createdAt: "2025-01-10",
    deadline: "2025-01-20",
    isAccentMode: false,
  },
  {
    id: "2",
    title: "「雨」のアクセントは？",
    description: "地域によって異なる「雨」のアクセントを調査",
    category: "アクセント",
    status: "active",
    voteCount: 189,
    createdAt: "2025-01-12",
    deadline: "2025-01-22",
    isAccentMode: true,
  },
  {
    id: "3",
    title: "冬の定番飲み物は？",
    description: "寒い冬に飲みたくなる飲み物を調査",
    category: "グルメ",
    status: "active",
    voteCount: 256,
    createdAt: "2025-01-08",
    deadline: "2025-01-18",
    isAccentMode: false,
  },
  {
    id: "4",
    title: "好きなゲーム機は？",
    description: "人気のゲーム機を調査します",
    category: "エンタメ",
    status: "closed",
    voteCount: 892,
    createdAt: "2024-12-20",
    deadline: "2025-01-05",
    isAccentMode: false,
  },
];

export default function PollsManagementPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls`);
      if (response.ok) {
        const data = await response.json();
        const pollsData = data.data?.polls || [];
        // データ形式を整形
        const formattedPolls = pollsData.map((poll: Record<string, unknown>) => ({
          ...poll,
          voteCount: Array.isArray(poll.votes) ? poll.votes.length : 0,
          category: Array.isArray(poll.categories) ? poll.categories[0] :
                    (typeof poll.categories === 'string' ? JSON.parse(poll.categories)[0] : ''),
          createdAt: new Date(poll.createdAt as string).toLocaleDateString('ja-JP'),
          deadline: poll.deadline ? new Date(poll.deadline as string).toLocaleDateString('ja-JP') : '',
        }));
        setPolls(formattedPolls);
      } else {
        // エラー時はモックデータを使用
        setPolls(mockPolls);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
      // エラー時はモックデータを使用
      setPolls(mockPolls);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || poll.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm("この投票を削除してもよろしいですか？")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setPolls(polls.filter((poll) => poll.id !== id));
        } else {
          alert("投票の削除に失敗しました");
        }
      } catch (error) {
        console.error("Failed to delete poll:", error);
        alert("投票の削除に失敗しました");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">投票管理</h2>
        <Link href="/admin/polls/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規投票作成
          </Button>
        </Link>
      </div>

      {/* フィルターバー */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="タイトルまたは説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="active">実施中</SelectItem>
                <SelectItem value="closed">終了</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="カテゴリー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="アクセント">アクセント</SelectItem>
                <SelectItem value="グルメ">グルメ</SelectItem>
                <SelectItem value="エンタメ">エンタメ</SelectItem>
                <SelectItem value="ニュース">ニュース</SelectItem>
                <SelectItem value="雑学">雑学</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">総投票数</p>
          <p className="text-2xl font-bold">{filteredPolls.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">実施中</p>
          <p className="text-2xl font-bold">
            {filteredPolls.filter(p => p.status === "active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">総投票数</p>
          <p className="text-2xl font-bold">
            {filteredPolls.reduce((sum, poll) => sum + poll.voteCount, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">平均投票数</p>
          <p className="text-2xl font-bold">
            {Math.round(
              filteredPolls.reduce((sum, poll) => sum + poll.voteCount, 0) /
              (filteredPolls.length || 1)
            ).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* 投票テーブル */}
      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">読み込み中...</p>
        </Card>
      ) : (
        <PollTable
          polls={filteredPolls}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}