"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PollForm from "@/components/features/admin/PollForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewPollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      // API呼び出しのシミュレーション
      console.log("Creating new poll:", data);

      // TODO: 実際のAPI呼び出しを実装
      // const response = await fetch("/api/admin/polls", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });

      // 成功時は一覧ページにリダイレクト
      setTimeout(() => {
        router.push("/admin/polls");
      }, 1000);
    } catch (error) {
      console.error("Failed to create poll:", error);
      alert("投票の作成に失敗しました");
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