'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import UserStatusDisplay from '@/components/UserStatusDisplay';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">気になる</span>
            <span className="text-xl font-bold">投票所</span>
          </Link>

          {/* Desktop Right Side - User Menu and Request Button */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild>
              <Link href="/request" className="bg-primary-600 hover:bg-primary-700 text-white">
                投票リクエストはこちら
              </Link>
            </Button>
            <UserStatusDisplay />
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
            <div className="flex flex-col space-y-3">
              <Button asChild className="w-full">
                <Link href="/request" className="bg-primary-600 hover:bg-primary-700 text-white" onClick={() => setIsMenuOpen(false)}>
                  投票リクエストはこちら
                </Link>
              </Button>
              <div className="border-t pt-3">
                <UserStatusDisplay />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}