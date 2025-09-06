'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  Database,
  Upload,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Vote
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: 'ダッシュボード',
    href: '/admin',
    icon: Home,
  },
  {
    title: '単語管理',
    href: '/admin/words',
    icon: FileText,
  },
  {
    title: '投票管理',
    href: '/admin/polls',
    icon: Vote,
  },
  {
    title: '統計',
    href: '/admin/stats',
    icon: BarChart3,
  },
  {
    title: 'ユーザー管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'データ管理',
    href: '/admin/data',
    icon: Database,
  },
  {
    title: '一括インポート',
    href: '/admin/import',
    icon: Upload,
  },
  {
    title: 'セキュリティ',
    href: '/admin/security',
    icon: Shield,
  },
  {
    title: '設定',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'bg-gray-900 text-white transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ロゴエリア */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className={cn(
            'font-bold text-xl transition-opacity',
            isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
          )}>
            管理画面
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                isCollapsed && 'justify-center'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.title}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && (
            <span className="text-sm font-medium">サイトに戻る</span>
          )}
        </Link>
      </div>
    </div>
  );
}