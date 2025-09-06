'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PollCategory } from '@/types/polls';

export default function RequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as PollCategory,
    requesterEmail: '',
    requesterName: '',
    additionalInfo: '',
  });

  const categories: { value: PollCategory; label: string }[] = [
    { value: 'general', label: '一般' },
    { value: 'tech', label: '技術・IT' },
    { value: 'culture', label: '文化・芸術' },
    { value: 'lifestyle', label: 'ライフスタイル' },
    { value: 'entertainment', label: 'エンタメ' },
    { value: 'education', label: '教育・学習' },
    { value: 'business', label: 'ビジネス' },
    { value: 'other', label: 'その他' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.title.trim()) {
      toast.error('投票タイトルを入力してください');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('投票の説明を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: API実装後、実際のエンドポイントに接続
      // const response = await fetch('/api/polls/request', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // 仮の成功処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('投票リクエストを受け付けました');
      
      // フォームをリセット
      setFormData({
        title: '',
        description: '',
        category: 'general',
        requesterEmail: '',
        requesterName: '',
        additionalInfo: '',
      });
      
      // トップページにリダイレクト
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Request submission error:', error);
      toast.error('リクエストの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* ページヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              投票リクエスト
            </h1>
            <p className="text-gray-600">
              みんなに聞いてみたい投票テーマをリクエストしてください
            </p>
          </div>

          {/* リクエストフォーム */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 投票タイトル */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  投票タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="例：好きなプログラミング言語は？"
                  maxLength={100}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.title.length}/100文字
                </p>
              </div>

              {/* 投票の説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  投票の説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="どのような投票を行いたいか、詳しく説明してください"
                  maxLength={500}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/500文字
                </p>
              </div>

              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 追加情報 */}
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  追加情報（任意）
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="選択肢の候補、参考情報など"
                  maxLength={1000}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.additionalInfo.length}/1000文字
                </p>
              </div>

              {/* リクエスター情報（任意） */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  連絡先情報（任意）
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  投票が作成された際にお知らせを受け取りたい場合は入力してください
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-2">
                      お名前
                    </label>
                    <input
                      type="text"
                      id="requesterName"
                      name="requesterName"
                      value={formData.requesterName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="山田太郎"
                    />
                  </div>

                  <div>
                    <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      id="requesterEmail"
                      name="requesterEmail"
                      value={formData.requesterEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="example@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">注意事項</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 不適切な内容のリクエストは承認されない場合があります</li>
                  <li>• リクエストの承認には数日かかる場合があります</li>
                  <li>• 類似の投票が既に存在する場合は作成されない可能性があります</li>
                </ul>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    px-8 py-3 rounded-lg font-medium text-white
                    ${isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
                    }
                    transition-colors duration-200
                  `}
                >
                  {isSubmitting ? '送信中...' : 'リクエストを送信'}
                </button>
              </div>
            </form>
          </div>

          {/* 戻るリンク */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              トップページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}