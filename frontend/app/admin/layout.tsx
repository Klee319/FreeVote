import { Metadata } from "next";
import AdminSidebar from "@/components/layout/AdminSidebar";

export const metadata: Metadata = {
  title: "管理画面 - みんなの投票",
  description: "みんなの投票 管理画面",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <AdminSidebar />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ページコンテンツ */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}