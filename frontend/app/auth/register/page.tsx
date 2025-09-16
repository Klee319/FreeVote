'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { RegisterData } from '@/types';
import { Separator } from '@/components/ui/separator';
import { PREFECTURES, AGE_GROUPS, GENDERS } from '@/lib/constants';
import { Twitter, Instagram, Mail } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, socialLogin, isLoading, error } = useAuth();

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    username: '',
    ageGroup: '',
    prefecture: '',
    gender: 'other',
  });

  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (formData.password !== passwordConfirm) {
      setValidationError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('パスワードは8文字以上で入力してください');
      return;
    }

    if (!formData.ageGroup || !formData.prefecture || !formData.gender) {
      setValidationError('必須項目をすべて入力してください');
      return;
    }

    const result = await register(formData);
    if (result.success) {
      router.push('/');
    }
  };

  const handleSocialRegister = async (provider: string) => {
    // In a real implementation, this would redirect to OAuth provider
    // After OAuth, it would come back with user data
    alert(`${provider}連携は現在開発中です`);
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>
            アカウントを作成して、すべての機能をお楽しみください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="username">ユーザー名（任意）</Label>
              <Input
                id="username"
                type="text"
                placeholder="表示名"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">パスワード *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8文字以上"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="passwordConfirm">パスワード確認 *</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="再入力"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prefecture">都道府県 *</Label>
              <Select
                value={formData.prefecture}
                onValueChange={(value) =>
                  setFormData({ ...formData, prefecture: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="prefecture">
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((pref) => (
                    <SelectItem key={pref.value} value={pref.value}>
                      {pref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageGroup">年代 *</Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ageGroup: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="ageGroup">
                    <SelectValue placeholder="年代を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((age) => (
                      <SelectItem key={age.value} value={age.value}>
                        {age.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">性別 *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(error || validationError) && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error || validationError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登録中...' : '登録する'}
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

          {/* Social Registration Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialRegister('twitter')}
              disabled={isLoading}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitterで登録
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialRegister('instagram')}
              disabled={isLoading}
            >
              <Instagram className="h-4 w-4 mr-2" />
              Instagramで登録
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialRegister('tiktok')}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              TikTokで登録
            </Button>
          </div>

          {/* Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は
            <Link href="/auth/login" className="text-primary hover:underline ml-1">
              ログイン
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            登録することで
            <Link href="/terms" className="text-primary hover:underline mx-1">
              利用規約
            </Link>
            と
            <Link href="/privacy" className="text-primary hover:underline mx-1">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます
          </div>
        </CardContent>
      </Card>
    </div>
  );
}