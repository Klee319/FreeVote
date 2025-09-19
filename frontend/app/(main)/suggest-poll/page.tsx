'use client';

import React, { useState } from 'react';
import { LightBulbIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface PollSuggestion {
  title: string;
  description: string;
  category: string;
  options: string[];
  contactEmail?: string;
  reason?: string;
}

const categories = [
  { value: 'technology', label: 'テクノロジー', icon: '💻' },
  { value: 'lifestyle', label: 'ライフスタイル', icon: '🏠' },
  { value: 'entertainment', label: 'エンタメ', icon: '🎬' },
  { value: 'sports', label: 'スポーツ', icon: '⚽' },
  { value: 'food', label: '食べ物', icon: '🍔' },
  { value: 'travel', label: '旅行', icon: '✈️' },
  { value: 'education', label: '教育', icon: '📚' },
  { value: 'business', label: 'ビジネス', icon: '💼' },
  { value: 'health', label: '健康', icon: '🏥' },
  { value: 'other', label: 'その他', icon: '📝' }
];

export default function SuggestPollPage() {
  const [formData, setFormData] = useState<PollSuggestion>({
    title: '',
    description: '',
    category: '',
    options: ['', ''],
    contactEmail: '',
    reason: ''
  });

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setErrorMessage('投票のタイトルを入力してください');
      return false;
    }
    if (!formData.description.trim()) {
      setErrorMessage('投票の説明を入力してください');
      return false;
    }
    if (!formData.category) {
      setErrorMessage('カテゴリーを選択してください');
      return false;
    }
    const validOptions = formData.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setErrorMessage('少なくとも2つの選択肢を入力してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('submitting');
    setErrorMessage('');

    try {
      // 実際のAPI呼び出しはここに実装
      // const response = await fetch('/api/poll-suggestions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // シミュレーション用の遅延
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 成功時の処理
      setSubmitStatus('success');

      // フォームをリセット
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: '',
          options: ['', ''],
          contactEmail: '',
          reason: ''
        });
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to submit poll suggestion:', error);
      setSubmitStatus('error');
      setErrorMessage('送信中にエラーが発生しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <LightBulbIcon className="w-12 h-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              投票を提案
            </h1>
          </div>
          <p className="text-gray-600">
            みんなが投票したくなるような面白い投票のアイデアを教えてください！
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                投票のタイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例：2025年最も期待される技術は？"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100文字</p>
            </div>

            {/* 説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                投票の説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="どんな投票なのか、なぜこの投票が面白いのかを説明してください"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500文字</p>
            </div>

            {/* カテゴリー */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">カテゴリーを選択してください</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 選択肢 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選択肢 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">（2〜10個まで）</span>
              </label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-8">#{index + 1}</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`選択肢 ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  + 選択肢を追加
                </button>
              )}
            </div>

            {/* 提案理由（オプション） */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                提案理由（任意）
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="なぜこの投票を提案したいと思いましたか？"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                maxLength={300}
              />
            </div>

            {/* 連絡先メールアドレス（オプション） */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                連絡先メールアドレス（任意）
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                投票が採用された場合にお知らせします
              </p>
            </div>

            {/* エラーメッセージ */}
            {submitStatus === 'error' && errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <XCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* 成功メッセージ */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">提案を受け付けました！</p>
                  <p className="text-xs text-green-700 mt-1">
                    ご提案ありがとうございます。内容を確認後、採用を検討させていただきます。
                  </p>
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={submitStatus === 'submitting' || submitStatus === 'success'}
              className={`
                w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center
                ${submitStatus === 'submitting' || submitStatus === 'success'
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'}
              `}
            >
              {submitStatus === 'submitting' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  送信中...
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  送信完了
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                  提案を送信
                </>
              )}
            </button>
          </form>
        </div>

        {/* ガイドライン */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">投票提案のガイドライン</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>多くの人が興味を持つトピックを選んでください</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>選択肢は明確で、重複しないようにしてください</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>公序良俗に反する内容は避けてください</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>個人や特定の団体を攻撃する内容は禁止です</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}