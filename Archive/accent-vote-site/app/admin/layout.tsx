import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/features/admin/AdminSidebar';
import { AdminHeader } from '@/components/features/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <AdminSidebar />
      
      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <AdminHeader />
        
        {/* コンテンツエリア */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}