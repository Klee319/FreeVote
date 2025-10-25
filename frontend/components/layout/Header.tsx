'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Plus, Menu } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getRankBadge = (referralCount: number) => {
    if (referralCount >= 100) return { name: 'プラチナ', color: 'bg-purple-500' };
    if (referralCount >= 50) return { name: 'ゴールド', color: 'bg-yellow-500' };
    if (referralCount >= 20) return { name: 'シルバー', color: 'bg-gray-400' };
    if (referralCount >= 5) return { name: 'ブロンズ', color: 'bg-orange-600' };
    return null;
  };

  const rankBadge = user ? getRankBadge(user.referralCount) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">
              みんなの投票
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Request Button */}
            <Button variant="outline" asChild>
              <Link href="/suggest-poll">
                <Plus className="mr-2 h-4 w-4" />
                投票を提案
              </Link>
            </Button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className="text-sm md:text-base">{user.username || 'ユーザー'}</span>
                      <div className="flex items-center gap-2">
                        {rankBadge && (
                          <span className={`px-2 py-0.5 md:py-1 text-xs text-white rounded ${rankBadge.color}`}>
                            {rankBadge.name}
                          </span>
                        )}
                        {user.referralCount > 0 && (
                          <span className="text-xs md:text-sm text-muted-foreground">
                            紹介: {user.referralCount}人
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">プロフィール</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">ブックマーク</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">ログイン</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">新規登録</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            {/* Mobile Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/suggest-poll">
                  <Plus className="mr-2 h-4 w-4" />
                  投票を提案
                </Link>
              </Button>

              {isAuthenticated && user ? (
                <>
                  <div className="flex flex-col gap-2 px-4 py-3 bg-muted rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{user.username || 'ユーザー'}</span>
                      {rankBadge && (
                        <span className={`px-2 py-1 text-xs text-white rounded ${rankBadge.color}`}>
                          {rankBadge.name}
                        </span>
                      )}
                    </div>
                    {user.referralCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        紹介人数: {user.referralCount}人
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/profile">プロフィール</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/bookmarks">ブックマーク</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={logout}
                  >
                    ログアウト
                  </Button>
                </>
              ) : (
                <>
                  <Button className="w-full" asChild>
                    <Link href="/auth/register">新規登録</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">ログイン</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}