'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, '投票タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
  description: z.string().max(500, '説明文は500文字以内で入力してください').optional(),
  options: z.array(z.object({
    text: z.string().min(1, '選択肢は必須です').max(100, '選択肢は100文字以内で入力してください'),
    thumbnailUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  })).min(2, '選択肢は最低2つ必要です').max(4, '選択肢は最大4つまでです'),
  deadline: z.date().optional(),
  shareHashtags: z.string().max(100, 'ハッシュタグは100文字以内で入力してください').optional(),
  thumbnailUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export default function NewPollPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      options: [
        { text: '', thumbnailUrl: '' },
        { text: '', thumbnailUrl: '' },
      ],
      shareHashtags: '',
      thumbnailUrl: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const addOption = () => {
    if (fields.length < 4) {
      append({ text: '', thumbnailUrl: '' });
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
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
        isAccentMode: false, // 常に通常投票として処理
        deadline: data.deadline?.toISOString(),
        shareHashtags: data.shareHashtags || undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
        options: data.options.map(opt => opt.text).filter(text => text),
        optionThumbnails: data.options.map(opt => opt.thumbnailUrl || undefined),
      };

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.details 
          ? `投票の作成に失敗しました: ${error.message}\n詳細: ${JSON.stringify(error.details)}`
          : error.message || '投票の作成に失敗しました';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // 成功時は一覧画面にリダイレクト
      router.push('/admin/polls');
    } catch (error) {
      console.error('Failed to create poll:', error);
      setSubmitError(error instanceof Error ? error.message : '投票の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">新規投票作成</h1>
          <p className="text-gray-600 mt-2">新しい汎用投票を作成します</p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>投票の基本的な情報を入力してください</CardDescription>
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

            </CardContent>
          </Card>

          {/* 選択肢 */}
          <Card>
            <CardHeader>
              <CardTitle>選択肢</CardTitle>
              <CardDescription>
                投票の選択肢を2〜4個設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">選択肢 {index + 1}</h4>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
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

              {fields.length < 4 && (
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
              <CardDescription>投票の詳細な設定を行います</CardDescription>
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
                          selected={field.value}
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
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              プレビュー
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  作成中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  投票を作成
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* プレビューダイアログ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>投票プレビュー</DialogTitle>
            <DialogDescription>
              実際の投票画面のプレビューを表示しています
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* メイン画像 */}
            {form.watch('thumbnailUrl') && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={form.watch('thumbnailUrl')} 
                  alt="投票のサムネイル"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* タイトル */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {form.watch('title') || '（タイトル未入力）'}
              </h2>
              {form.watch('description') && (
                <p className="mt-2 text-gray-600">
                  {form.watch('description')}
                </p>
              )}
            </div>

            {/* 投票期限 */}
            {form.watch('deadline') && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>投票期限: {format(form.watch('deadline')!, 'yyyy年MM月dd日', { locale: ja })}</span>
              </div>
            )}

            {/* 選択肢 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">選択肢</h3>
              <div className="grid gap-3">
                {form.watch('options').map((option, index) => (
                  option.text && (
                    <div key={index} className="border rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        {option.thumbnailUrl && (
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={option.thumbnailUrl} 
                              alt={option.text}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="text-gray-900">{option.text}</span>
                        </div>
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* ハッシュタグ */}
            {form.watch('shareHashtags') && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  共有時のハッシュタグ: {form.watch('shareHashtags')}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowPreview(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}