"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import PollForm from "@/components/features/admin/PollForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PollFormData {
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  isAccentMode: boolean;
  options: Array<{
    label: string;
    thumbnailUrl?: string;
    pitchPattern?: string;
  }>;
  deadline: Date;
  shareMessage?: string;
  shareHashtags?: string;
}

// モックデータ
const mockPoll = {
  title: "好きなラーメンの種類は？",
  description: "日本人の国民食、ラーメンの好みを調査します",
  category: "グルメ",
  isAccentMode: false,
  options: [
    { label: "醤油ラーメン", thumbnailUrl: "" },
    { label: "味噌ラーメン", thumbnailUrl: "" },
    { label: "塩ラーメン", thumbnailUrl: "" },
    { label: "とんこつラーメン", thumbnailUrl: "" },
  ],
  deadline: new Date("2025-01-20"),
  shareMessage: "私は◯◯に投票しました！みんなも投票しよう！",
  shareHashtags: "#みんなの投票 #ラーメン",
};

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [pollData, setPollData] = useState<PollFormData | null>(null);

  useEffect(() => {
    // データ取得のシミュレーション
    setTimeout(() => {
      setPollData(mockPoll);
    }, 500);
  }, [params.id]);

  const handleSubmit = async (data: PollFormData) => {
    setLoading(true);
    try {
      // API呼び出しのシミュレーション
      console.log("Updating poll:", params.id, data);

      // TODO: 実際のAPI呼び出しを実装
      // const response = await fetch(`/api/admin/polls/${params.id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });

      // 成功時は一覧ページにリダイレクト
      setTimeout(() => {
        router.push("/admin/polls");
      }, 1000);
    } catch (error) {
      console.error("Failed to update poll:", error);
      alert("投票の更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!pollData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/polls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            投票一覧に戻る
          </Button>
        </Link>
        <h2 className="text-3xl font-bold">投票を編集</h2>
        <p className="text-gray-600 mt-2">
          既存の投票を編集します。締切後の編集はできません。
        </p>
      </div>

      <PollForm
        initialData={pollData}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}