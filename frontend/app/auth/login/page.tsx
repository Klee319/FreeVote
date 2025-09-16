'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Twitter, Instagram, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, socialLogin, isLoading, error } = useAuth();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(credentials);
    if (result.success) {
      router.push('/');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    // In a real implementation, this would redirect to OAuth provider
    // For now, we'll show a placeholder message
    alert(`${provider}連携は現在開発中です`);
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            アカウントにログインして、投票に参加しましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  または
                </span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('twitter')}
              disabled={isLoading}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitterでログイン
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('instagram')}
              disabled={isLoading}
            >
              <Instagram className="h-4 w-4 mr-2" />
              Instagramでログイン
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('tiktok')}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              TikTokでログイン
            </Button>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              アカウントをお持ちでない方は
              <Link href="/auth/register" className="text-primary hover:underline ml-1">
                新規登録
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                パスワードをお忘れですか？
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}