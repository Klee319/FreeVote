'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  CalendarIcon,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Save,
  Eye,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, '投票タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
  description: z.string().max(500, '説明文は500文字以内で入力してください').optional(),
  options: z.array(z.object({
    text: z.string().min(1, '選択肢は必須です').max(100, '選択肢は100文字以内で入力してください'),
    thumbnailUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  })).min(2, '選択肢は最低2つ必要です').max(4, '選択肢は最大4つまでです'),
  isAccentMode: z.boolean().optional().default(false),
  deadline: z.date().optional().nullable(),
  shareHashtags: z.string().max(100, 'ハッシュタグは100文字以内で入力してください').optional(),
  thumbnailUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface PollData {
  id: number;
  title: string;
  description?: string;
  options: string[];
  optionThumbnails?: (string | null)[];
  isAccentMode?: boolean;
  deadline?: string;
  shareHashtags?: string;
  thumbnailUrl?: string;
  totalVotes?: number;
  status: string;
}

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      options: [
        { text: '', thumbnailUrl: '' },
        { text: '', thumbnailUrl: '' },
      ],
      isAccentMode: false,
      shareHashtags: '',
      thumbnailUrl: '',
    },
  });

  // 既存の投票データを取得
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/polls/${pollId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('投票データの取得に失敗しました');
        }

        const data = await response.json();
        const poll = data.data;
        setPollData(poll);

        // フォームに既存データをセット
        form.reset({
          title: poll.title || '',
          description: poll.description || '',
          options: poll.options.map((opt: string, index: number) => ({
            text: opt,
            thumbnailUrl: poll.optionThumbnails?.[index] || '',
          })),
          isAccentMode: poll.isAccentMode || false,
          deadline: poll.deadline ? new Date(poll.deadline) : null,
          shareHashtags: poll.shareHashtags || '',
          thumbnailUrl: poll.thumbnailUrl || '',
        });
      } catch (error) {
        console.error('Failed to fetch poll data:', error);
        setSubmitError('投票データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (pollId) {
      fetchPollData();
    }
  }, [pollId, form]);

  const addOption = () => {
    const currentOptions = form.getValues('options');
    if (currentOptions.length < 4) {
      form.setValue('options', [...currentOptions, { text: '', thumbnailUrl: '' }]);
    }
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues('options');
    if (currentOptions.length > 2) {
      const newOptions = [...currentOptions];
      newOptions.splice(index, 1);
      form.setValue('options', newOptions);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // APIリクエスト用のデータを整形
      const requestData = {
        title: data.title,
        description: data.description || undefined,
        options: data.options.map(opt => opt.text).filter(text => text),
        optionThumbnails: data.options.map(opt => opt.thumbnailUrl || undefined),
        isAccentMode: data.isAccentMode,
        deadline: data.deadline?.toISOString(),
        shareHashtags: data.shareHashtags || undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
      };

      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '投票の更新に失敗しました');
      }

      const result = await response.json();
      
      // 成功時は一覧画面にリダイレクト
      router.push('/admin/polls');
    } catch (error) {
      console.error('Failed to update poll:', error);
      setSubmitError(error instanceof Error ? error.message : '投票の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/admin/polls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">投票編集</h1>
          <p className="text-gray-600 mt-2">
            投票ID: {pollId} | 総投票数: {pollData?.totalVotes || 0}
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {pollData && pollData.totalVotes && pollData.totalVotes > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            この投票には既に{pollData.totalVotes}件の投票があります。
            選択肢の削除や大幅な変更は避けることを推奨します。
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>投票の基本的な情報を編集してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>投票タイトル *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 好きな季節は？" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明文</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="投票についての説明を入力してください"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      投票の詳細や背景情報を記載できます（任意）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAccentMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">アクセントモード</FormLabel>
                      <FormDescription>
                        アクセント関連の投票の場合はONにしてください
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 選択肢 */}
          <Card>
            <CardHeader>
              <CardTitle>選択肢</CardTitle>
              <CardDescription>
                投票の選択肢を2〜4個設定してください
                {pollData && pollData.totalVotes && pollData.totalVotes > 0 && (
                  <span className="text-amber-600 ml-2">
                    ※既に投票があるため、選択肢の削除は推奨されません
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('options').map((_, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">選択肢 {index + 1}</h4>
                    {form.watch('options').length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        disabled={pollData?.totalVotes ? pollData.totalVotes > 0 : false}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>選択肢テキスト *</FormLabel>
                        <FormControl>
                          <Input placeholder={`選択肢 ${index + 1} を入力`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`options.${index}.thumbnailUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>サムネイルURL（任意）</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          選択肢のイメージ画像URLを指定できます
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              {form.watch('options').length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  選択肢を追加
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 詳細設定 */}
          <Card>
            <CardHeader>
              <CardTitle>詳細設定</CardTitle>
              <CardDescription>投票の詳細な設定を編集します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>締切日時</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP HH:mm', { locale: ja })
                            ) : (
                              <span>締切日時を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      締切日時を設定すると、その時刻以降は投票を受け付けません
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shareHashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SNS共有用ハッシュタグ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#投票 #アンケート"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      SNS共有時に使用するハッシュタグを設定できます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>投票サムネイル画像URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/thumbnail.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      投票一覧やSNS共有時に表示される画像のURLを指定できます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* フォームアクション */}
          <div className="flex justify-end gap-3">
            <Link href="/admin/polls">
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="button" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              プレビュー
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  変更を保存
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}