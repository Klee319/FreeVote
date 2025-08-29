'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useCookieAuth } from '@/hooks/useCookieAuth';

export function Header() {
  const router = useRouter();
  const { user, logout } = useCookieAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ユーザーメニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'トップ' },
    { href: '/ranking', label: 'ランキング' },
    { href: '/search', label: '検索' },
    { href: '/submit', label: '新語投稿' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">日本語</span>
            <span className="text-xl">アクセント</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="語を検索..."
                className="w-64 px-4 py-2 pl-10 pr-4 text-sm border rounded-lg focus:border-primary-500 focus:outline-none"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ユーザーメニュー"
              >
                <UserCircleIcon className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* ドロップダウンメニュー */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.displayName || 'ゲストユーザー'}
                        </p>
                        {user.region && (
                          <p className="text-xs text-gray-500 mt-1">
                            地域: {user.region}
                          </p>
                        )}
                        {user.ageGroup && (
                          <p className="text-xs text-gray-500">
                            年代: {user.ageGroup}
                          </p>
                        )}
                      </div>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        設定
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        ログアウト
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-sm text-gray-600">
                          ログインしていません
                        </p>
                      </div>
                      <Link
                        href="/login"
                        className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-gray-50 transition-colors font-medium"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        ログイン
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="語を検索..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-sm border rounded-lg focus:border-primary-500 focus:outline-none"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {user.displayName || 'ゲストユーザー'}
                      </p>
                      {user.region && (
                        <p className="text-xs text-gray-500 mt-1">地域: {user.region}</p>
                      )}
                    </div>
                    <Link
                      href="/settings"
                      className="px-3 py-2 text-sm font-medium text-left rounded-lg hover:bg-gray-100 block"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      設定
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-left rounded-lg hover:bg-gray-100 w-full text-left"
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-2 text-sm font-medium text-left rounded-lg hover:bg-gray-100 block text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}