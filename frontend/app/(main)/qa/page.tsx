'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface QAItem {
  question: string;
  answer: string;
}

interface QACategory {
  title: string;
  icon: string;
  items: QAItem[];
}

const qaData: QACategory[] = [
  {
    title: '基本的な使い方',
    icon: '📚',
    items: [
      {
        question: 'みんなの投票プラットフォームとは何ですか？',
        answer: 'みんなの投票プラットフォームは、様々なトピックについて意見を共有し、投票できるオンラインサービスです。誰でも簡単に投票に参加でき、リアルタイムで結果を確認できます。'
      },
      {
        question: '投票に参加するには登録が必要ですか？',
        answer: 'いいえ、投票への参加には登録は必要ありません。ただし、投票結果を保存したり、お気に入りの投票を管理したい場合は、無料のアカウント登録をお勧めします。'
      },
      {
        question: '投票結果はいつ更新されますか？',
        answer: '投票結果はリアルタイムで更新されます。投票した瞬間に結果に反映され、他のユーザーも最新の結果を確認できます。'
      }
    ]
  },
  {
    title: '投票について',
    icon: '🗳️',
    items: [
      {
        question: '一つの投票に何回まで参加できますか？',
        answer: '公平性を保つため、各投票には1人1回までの参加となります。同じIPアドレスやデバイスからの重複投票は自動的に制限されます。'
      },
      {
        question: '投票を作成することはできますか？',
        answer: '現在、投票の作成は管理者のみが可能です。投票のアイデアがある場合は、「投票提案」ページから提案していただけます。'
      },
      {
        question: '投票結果をシェアすることはできますか？',
        answer: 'はい、各投票ページにはシェアボタンがあり、SNSで簡単に投票結果を共有できます。Twitter、Facebook、LINEなどの主要なSNSに対応しています。'
      }
    ]
  },
  {
    title: 'アカウントについて',
    icon: '👤',
    items: [
      {
        question: 'アカウント登録のメリットは何ですか？',
        answer: 'アカウント登録をすると、投票履歴の保存、お気に入り投票の管理、投票結果の通知設定などの機能が利用できるようになります。'
      },
      {
        question: 'パスワードを忘れた場合はどうすればいいですか？',
        answer: 'ログインページの「パスワードを忘れた方」リンクから、登録メールアドレスにパスワードリセットのリンクを送信できます。'
      },
      {
        question: 'アカウントの削除はできますか？',
        answer: 'はい、アカウント設定ページから、いつでもアカウントを削除できます。削除すると、すべての投票履歴とデータが完全に削除されます。'
      }
    ]
  },
  {
    title: 'トラブルシューティング',
    icon: '🔧',
    items: [
      {
        question: '投票ボタンが押せません',
        answer: 'ブラウザのJavaScriptが有効になっているか確認してください。また、広告ブロッカーが原因の場合があるため、一時的に無効にしてみてください。'
      },
      {
        question: '投票結果が表示されません',
        answer: 'ページを再読み込みしてみてください。問題が続く場合は、ブラウザのキャッシュをクリアするか、別のブラウザでお試しください。'
      },
      {
        question: 'エラーメッセージが表示されます',
        answer: 'エラーメッセージの内容を確認し、指示に従ってください。解決しない場合は、お問い合わせフォームからサポートにご連絡ください。'
      }
    ]
  }
];

export default function QAPage() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
            よくある質問
          </h1>
          <p className="text-sm md:text-base text-gray-600 px-2">
            みんなの投票プラットフォームの使い方やよくある質問をまとめました
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          {qaData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
                  <span className="text-xl md:text-2xl mr-2 md:mr-3">{category.icon}</span>
                  {category.title}
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isExpanded = expandedItems[key];

                  return (
                    <div key={itemIndex} className="transition-all duration-200">
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full px-4 md:px-6 py-3 md:py-4 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between group"
                      >
                        <span className="font-medium text-sm md:text-base text-gray-800 group-hover:text-blue-600 transition-colors pr-2">
                          {item.question}
                        </span>
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-100">
                          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">まだ解決しませんか？</h3>
          <p className="text-sm md:text-base mb-4 md:mb-6 px-2">
            お探しの答えが見つからない場合は、お気軽にお問い合わせください。
          </p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-gray-100 transition-colors">
            お問い合わせはこちら
          </button>
        </div>
      </div>
    </div>
  );
}