'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useCookieAuth } from '@/hooks/useCookieAuth';

// 都道府県データ
const PREFECTURES = [
  { code: '01', name: '北海道' },
  { code: '02', name: '青森県' },
  { code: '03', name: '岩手県' },
  { code: '04', name: '宮城県' },
  { code: '05', name: '秋田県' },
  { code: '06', name: '山形県' },
  { code: '07', name: '福島県' },
  { code: '08', name: '茨城県' },
  { code: '09', name: '栃木県' },
  { code: '10', name: '群馬県' },
  { code: '11', name: '埼玉県' },
  { code: '12', name: '千葉県' },
  { code: '13', name: '東京都' },
  { code: '14', name: '神奈川県' },
  { code: '15', name: '新潟県' },
  { code: '16', name: '富山県' },
  { code: '17', name: '石川県' },
  { code: '18', name: '福井県' },
  { code: '19', name: '山梨県' },
  { code: '20', name: '長野県' },
  { code: '21', name: '岐阜県' },
  { code: '22', name: '静岡県' },
  { code: '23', name: '愛知県' },
  { code: '24', name: '三重県' },
  { code: '25', name: '滋賀県' },
  { code: '26', name: '京都府' },
  { code: '27', name: '大阪府' },
  { code: '28', name: '兵庫県' },
  { code: '29', name: '奈良県' },
  { code: '30', name: '和歌山県' },
  { code: '31', name: '鳥取県' },
  { code: '32', name: '島根県' },
  { code: '33', name: '岡山県' },
  { code: '34', name: '広島県' },
  { code: '35', name: '山口県' },
  { code: '36', name: '徳島県' },
  { code: '37', name: '香川県' },
  { code: '38', name: '愛媛県' },
  { code: '39', name: '高知県' },
  { code: '40', name: '福岡県' },
  { code: '41', name: '佐賀県' },
  { code: '42', name: '長崎県' },
  { code: '43', name: '熊本県' },
  { code: '44', name: '大分県' },
  { code: '45', name: '宮崎県' },
  { code: '46', name: '鹿児島県' },
  { code: '47', name: '沖縄県' },
];

// 年齢層オプション
const AGE_GROUPS = [
  { value: '10s', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s', label: '60代' },
  { value: '70s+', label: '70代以上' },
];

// 性別オプション
const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer_not_to_say', label: '回答しない' },
];

interface AnonymousRegistrationFormProps {
  onSuccess?: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export default function AnonymousRegistrationForm({ 
  onSuccess, 
  onSkip,
  disabled = false 
}: AnonymousRegistrationFormProps) {
  const router = useRouter();
  const { register } = useCookieAuth(); // useCookieAuthから register 関数を取得
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フォーム状態
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [prefecture, setPrefecture] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!age || !gender || !prefecture) {
      setError('すべての項目を選択してください');
      return;
    }

    setIsLoading(true);

    try {
      // useCookieAuthのregister関数を使用して登録
      await register({
        age,
        gender,
        prefecture,
      });

      // 成功コールバックまたはホームページへ遷移
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push('/');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>はじめての方へ</CardTitle>
        <CardDescription>
          日本語アクセント投票サイトへようこそ！
          より正確な統計データを収集するため、簡単な属性情報を教えてください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="age">年齢層</Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger id="age">
                <SelectValue placeholder="年齢層を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="性別を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefecture">都道府県</Label>
            <Select value={prefecture} onValueChange={setPrefecture}>
              <SelectTrigger id="prefecture">
                <SelectValue placeholder="都道府県を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PREFECTURES.map((pref) => (
                  <SelectItem key={pref.code} value={pref.code}>
                    {pref.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || disabled || !age || !gender || !prefecture}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                '登録して始める'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading || disabled}
            >
              スキップ
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center pt-2">
            ※ 個人を特定する情報は一切収集しません
          </p>
        </form>
      </CardContent>
    </Card>
  );
}