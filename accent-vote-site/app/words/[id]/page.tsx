'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AccentVotingSection } from '@/components/features/accent/AccentVotingSection';
import { WordHeader } from '@/components/features/accent/WordHeader';
import { StatisticsVisualization } from '@/components/features/stats/StatisticsVisualization';
import { RelatedWords } from '@/components/features/accent/RelatedWords';
import toast from 'react-hot-toast';
import { useCookieAuth } from '@/hooks/useCookieAuth';

export default function WordDetailPage() {
  const params = useParams();
  const wordId = params.id as string;
  const queryClient = useQueryClient();
  const { user, isRegistered } = useCookieAuth();
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('13'); // 東京都をデフォルト
  
  // デバッグログ
  useEffect(() => {
    console.log('[WordDetailPage] Cookie Auth State:', {
      isRegistered,
      hasUser: !!user,
      deviceId: user?.deviceId,
      userDetails: user
    });
  }, [user, isRegistered]);

  // 語詳細取得
  const { data: wordDetail, isLoading, error } = useQuery({
    queryKey: ['wordDetail', wordId],
    queryFn: () => api.getWordDetail(wordId),
    enabled: !!wordId,
  });

  // 投票可能かチェック
  const { data: canVoteData } = useQuery({
    queryKey: ['canVote', wordId],
    queryFn: () => api.canVote(parseInt(wordId)),
    enabled: !!wordId,
  });

  // 投票処理
  const voteMutation = useMutation({
    mutationFn: async (accentTypeId: number) => {
      // Cookie認証から取得したdeviceIdを使用
      if (!user?.deviceId) {
        console.error('[WordDetailPage] No deviceId found in user context');
        throw new Error('認証情報が見つかりません。ページを再読み込みしてください。');
      }
      
      console.log('[WordDetailPage] Submitting vote with deviceId:', user.deviceId);

      return api.submitVote({
        wordId: parseInt(wordId),
        accentTypeId,
        prefecture: selectedPrefecture as any,
        deviceId: user.deviceId,
      });
    },
    onSuccess: async (response) => {
      toast.success('投票が完了しました！');
      console.log('[WordDetailPage] Vote successful, response:', response);
      
      // レスポンスから統計データを取得
      if (response?.stats) {
        console.log('[WordDetailPage] New stats from response:', response.stats);
        
        // wordDetailクエリのデータを直接更新
        queryClient.setQueryData(['wordDetail', wordId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            nationalStats: response.stats.national || oldData.nationalStats,
            totalVotes: response.stats.national?.reduce(
              (sum: number, stat: any) => sum + (stat.voteCount || 0), 
              0
            ) || oldData.totalVotes
          };
        });
      }
      
      // キャッシュを無効化して再フェッチ
      await queryClient.invalidateQueries({ queryKey: ['wordDetail', wordId] });
      await queryClient.invalidateQueries({ queryKey: ['canVote', wordId] });
      
      // 確実に最新データを取得
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['wordDetail', wordId] });
        queryClient.refetchQueries({ queryKey: ['canVote', wordId] });
      }, 100);
    },
    onError: (error: any) => {
      console.error('[WordDetailPage] Vote error:', error);
      toast.error(error?.message || '投票に失敗しました。もう一度お試しください。');
    },
  });

  const handleVote = (accentTypeId: number) => {
    if (canVoteData?.canVote === false) {
      toast.error(canVoteData.reason || '現在投票できません');
      return;
    }
    voteMutation.mutate(accentTypeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !wordDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">語が見つかりませんでした</h2>
          <p className="text-gray-600">指定された語は存在しないか、削除された可能性があります。</p>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-primary-600 hover:text-primary-700">ホーム</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{wordDetail.headword}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-8">
          {/* 語情報ヘッダー */}
          <WordHeader word={wordDetail} />

          {/* アクセント投票セクション */}
          <AccentVotingSection
            word={wordDetail}
            accentOptions={wordDetail.accentOptions}
            nationalStats={wordDetail.nationalStats}
            canVote={canVoteData?.canVote ?? true}
            onVote={handleVote}
            isVoting={voteMutation.isPending}
            selectedPrefecture={selectedPrefecture}
            onPrefectureChange={setSelectedPrefecture}
          />

          {/* 統計可視化 */}
          <StatisticsVisualization
            wordId={wordDetail.id}
            nationalStats={wordDetail.nationalStats}
            prefectureStats={wordDetail.prefectureStats}
            selectedPrefecture={selectedPrefecture}
            onPrefectureSelect={setSelectedPrefecture}
          />
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 関連語 */}
          <RelatedWords currentWordId={wordDetail.id} category={wordDetail.category} />

          {/* 投票統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">投票統計</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">総投票数</dt>
                <dd className="font-semibold">{wordDetail.totalVotes}票</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">参加都道府県</dt>
                <dd className="font-semibold">{wordDetail.prefectureCount}県</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">モーラ数</dt>
                <dd className="font-semibold">{wordDetail.moraCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">カテゴリ</dt>
                <dd className="font-semibold">
                  {wordDetail.category === 'general' ? '一般語' :
                   wordDetail.category === 'proper_noun' ? '固有名詞' :
                   wordDetail.category === 'technical' ? '専門用語' : '方言'}
                </dd>
              </div>
            </dl>
          </div>

          {/* シェアボタン */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">この語をシェア</h3>
            <div className="flex space-x-2">
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                Twitter
              </button>
              <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                LINE
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
                リンクをコピー
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}