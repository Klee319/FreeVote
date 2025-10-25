"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewPollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PollFormData) => {
    setLoading(true);
    try {
      // optionsをJSON文字列に変換
      const pollData = {
        ...data,
        options: data.options, // 配列のまま送信
        categories: [data.category], // 配列のまま送信
        deadline: data.deadline?.toISOString(),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error?.message || errorData.message || "Failed to create poll");
      }

      // 成功時は一覧ページにリダイレクト
      router.push("/admin/polls");
    } catch (error) {
      console.error("Failed to create poll:", error);
      alert(`投票の作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/polls">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            投票一覧に戻る
          </Button>
        </Link>
        <h2 className="text-3xl font-bold">新規投票作成</h2>
        <p className="text-gray-600 mt-2">
          新しい投票を作成します。必要な情報を入力してください。
        </p>
      </div>

      <PollForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}