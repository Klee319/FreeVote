'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SubmitTermData, WordCategory } from '@/types';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCookieAuth } from '@/hooks/useCookieAuth';

export default function SubmitPage() {
  const router = useRouter();
  const { user, isRegistered } = useCookieAuth();
  const [formData, setFormData] = useState<SubmitTermData>({
    term: '',
    reading: '',
    description: '',
    category: 'general',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitTermData, string>>>({});
  
  // デバッグログ
  useEffect(() => {
    console.log('[SubmitPage] Cookie Auth State:', {
      isRegistered,
      hasUser: !!user,
      deviceId: user?.deviceId,
      userDetails: user
    });
  }, [user, isRegistered]);

  const submitMutation = useMutation({
    mutationFn: (data: SubmitTermData) => api.submitTerm(data),
    onSuccess: (response) => {
      if (response.success) {
        // 成功時は3秒後にトップページへリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubmitTermData, string>> = {};

    if (!formData.term.trim()) {
      newErrors.term = '用語名を入力してください';
    } else if (formData.term.length > 50) {
      newErrors.term = '用語名は50文字以内で入力してください';
    }

    if (!formData.reading.trim()) {
      newErrors.reading = '読みを入力してください';
    } else if (!/^[ぁ-んー]+$/.test(formData.reading)) {
      newErrors.reading = '読みはひらがなで入力してください';
    } else if (formData.reading.length > 50) {
      newErrors.reading = '読みは50文字以内で入力してください';
    }

    if (!formData.description.trim()) {
      newErrors.description = '説明文を入力してください';
    } else if (formData.description.length < 10) {
      newErrors.description = '説明文は10文字以上で入力してください';
    } else if (formData.description.length > 500) {
      newErrors.description = '説明文は500文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Cookie認証から取得したdeviceIdを使用
    if (!user?.deviceId) {
      console.error('[SubmitPage] No deviceId found in user context');
      setErrors({ term: '認証情報が見つかりません。ページを再読み込みしてください。' });
      return;
    }
    
    console.log('[SubmitPage] Submitting term with deviceId:', user.deviceId);

    submitMutation.mutate({
      ...formData,
      deviceId: user.deviceId,
    });
  };

  const handleInputChange = (field: keyof SubmitTermData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryOptions: { value: WordCategory; label: string }[] = [
    { value: 'general', label: '一般語' },
    { value: 'proper_noun', label: '固有名詞' },
    { value: 'technical', label: '専門用語' },
    { value: 'dialect', label: '方言' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">新語を投稿</h1>
      <p className="text-gray-600 mb-8">
        アクセントを調べたい新しい用語を投稿できます。投稿内容は管理者による確認後に公開されます。
      </p>

      {/* 成功メッセージ */}
      {submitMutation.isSuccess && submitMutation.data?.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">{submitMutation.data.message}</p>
            <p className="text-green-600 text-sm mt-1">3秒後にトップページへ移動します...</p>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {submitMutation.isError || (submitMutation.data && !submitMutation.data.success) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <ExclamationCircleIcon className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">
              {submitMutation.data?.message || '投稿に失敗しました。もう一度お試しください。'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 用語名 */}
        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
            用語名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="term"
            value={formData.term}
            onChange={(e) => handleInputChange('term', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.term
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="例：コンピューター"
            disabled={submitMutation.isPending}
          />
          {errors.term && (
            <p className="mt-1 text-sm text-red-600">{errors.term}</p>
          )}
        </div>

        {/* 読み */}
        <div>
          <label htmlFor="reading" className="block text-sm font-medium text-gray-700 mb-2">
            読み（ひらがな） <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reading"
            value={formData.reading}
            onChange={(e) => handleInputChange('reading', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.reading
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="例：こんぴゅーたー"
            disabled={submitMutation.isPending}
          />
          {errors.reading && (
            <p className="mt-1 text-sm text-red-600">{errors.reading}</p>
          )}
        </div>

        {/* カテゴリー */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリー <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value as WordCategory)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={submitMutation.isPending}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 説明文 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            説明文 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="この用語について簡単に説明してください（10文字以上500文字以内）"
            disabled={submitMutation.isPending}
          />
          <div className="mt-1 flex justify-between">
            {errors.description ? (
              <p className="text-sm text-red-600">{errors.description}</p>
            ) : (
              <span></span>
            )}
            <span className="text-sm text-gray-500">
              {formData.description.length}/500
            </span>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitMutation.isPending}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitMutation.isPending || submitMutation.isSuccess}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {submitMutation.isPending && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitMutation.isPending ? '送信中...' : '投稿する'}
          </button>
        </div>
      </form>

      {/* 注意事項 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">投稿時の注意事項</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 不適切な内容や重複する用語は掲載されない場合があります</li>
          <li>• 投稿内容は管理者による確認後に公開されます</li>
          <li>• 読みはひらがなで正確に入力してください</li>
          <li>• カテゴリーは適切なものを選択してください</li>
        </ul>
      </div>
    </div>
  );
}