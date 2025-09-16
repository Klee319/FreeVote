"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Vote,
  FileText,
  Users,
  Database,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "ダッシュボード",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "投票管理",
    href: "/admin/polls",
    icon: Vote,
  },
  {
    title: "リクエスト管理",
    href: "/admin/requests",
    icon: FileText,
  },
  {
    title: "ユーザー管理",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "データ管理",
    href: "/admin/data",
    icon: Database,
  },
  {
    title: "セキュリティ",
    href: "/admin/security",
    icon: Shield,
  },
  {
    title: "設定",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold">管理画面</h2>
        <p className="text-sm text-gray-400 mt-1">みんなの投票</p>
      </div>

      <nav className="mt-8">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>サイトに戻る</span>
        </Link>
      </div>
    </aside>
  );
}