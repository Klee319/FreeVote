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
import WordAccentMapContainer from '@/components/features/map/WordAccentMapContainer';
import ShareModal from '@/components/features/share/ShareModal';
import toast from 'react-hot-toast';
import { useCookieAuth } from '@/hooks/useCookieAuth';
import { normalizeVoteResponseStats } from '@/lib/dataTransformers';

export default function WordDetailPage() {
  const params = useParams();
  const wordId = params.id as string;
  const queryClient = useQueryClient();
  const { user, isRegistered } = useCookieAuth();
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('13'); // 東京都をデフォルト
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
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
      
      console.log('[WordDetailPage] Submitting vote:', {
        wordId: parseInt(wordId),
        accentTypeId,
        prefecture: selectedPrefecture,
        hasDeviceId: !!user.deviceId
      });

      return api.submitVote({
        wordId: parseInt(wordId),
        accentTypeId,
        prefecture: selectedPrefecture as any,
        deviceId: user.deviceId,
      });
    },
    onSuccess: async (response) => {
      // 成功メッセージをカスタマイズ
      const successMessage = response.message || '投票が完了しました！';
      toast.success(successMessage);
      console.log('[WordDetailPage] Vote successful:', {
        message: successMessage,
        hasStats: !!(response?.stats || (response as any)?.statistics)
      });
      
      // レスポンスから統計データを取得して正規化
      if (response?.stats || (response as any)?.statistics) {
        console.log('[WordDetailPage] Updating stats from response');
        
        // データを正規化
        const normalizedStats = normalizeVoteResponseStats(response);
        
        // wordDetailクエリのデータを直接更新
        queryClient.setQueryData(['wordDetail', wordId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            nationalStats: normalizedStats.national.length > 0 
              ? normalizedStats.national 
              : oldData.nationalStats,
            prefectureStats: normalizedStats.prefecture || oldData.prefectureStats,
            totalVotes: normalizedStats.national.reduce(
              (sum: number, stat: any) => sum + stat.count, 
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
      // エラーの詳細なログ出力
      console.error('[WordDetailPage] Vote error:', {
        message: error?.message,
        statusCode: error?.statusCode,
        responseData: error?.responseData
      });
      
      // ステータスコードに応じたエラーメッセージ
      let errorMessage = error?.message || '投票に失敗しました。';
      
      // 特定のエラーに対してカスタムアクション
      if (error?.statusCode === 409 || error?.message?.includes('既に投票済み')) {
        // 重複投票の場合は、canVoteを再フェッチ
        queryClient.invalidateQueries({ queryKey: ['canVote', wordId] });
        errorMessage = 'この語には既に投票済みです。';
      } else if (error?.statusCode === 429) {
        // レート制限
        errorMessage = '投票の制限に達しました。しばらく待ってからお試しください。';
      } else if (error?.statusCode >= 500) {
        // サーバーエラー
        errorMessage = 'サーバーエラーが発生しました。しばらくしてから再度お試しください。';
      } else if (!error?.message) {
        // メッセージがない場合
        errorMessage = '予期しないエラーが発生しました。もう一度お試しください。';
      }
      
      toast.error(errorMessage);
    },
  });

  const handleVote = (accentTypeId: number) => {
    // 投票可否チェック
    if (canVoteData?.canVote === false) {
      // 理由をより具体的に表示
      const errorReason = canVoteData.hasVoted 
        ? 'この語には既に投票済みです。他の語への投票をお願いします。'
        : canVoteData.reason || '現在投票できません';
      toast.error(errorReason);
      console.log('[WordDetailPage] Vote blocked:', {
        canVote: canVoteData.canVote,
        hasVoted: canVoteData.hasVoted,
        reason: canVoteData.reason
      });
      return;
    }
    
    // デバイスIDがない場合のチェック
    if (!user?.deviceId) {
      toast.error('認証情報が見つかりません。ページを再読み込みしてください。');
      console.error('[WordDetailPage] No deviceId available for voting');
      return;
    }
    
    // 投票実行
    console.log('[WordDetailPage] Initiating vote:', {
      wordId,
      accentTypeId,
      prefecture: selectedPrefecture
    });
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

          {/* 地図表示トグル */}
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="font-bold text-lg">全国アクセント分布地図</h3>
              <svg 
                className={`w-5 h-5 transition-transform ${showMap ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* アクセント分布地図 */}
          {showMap && wordDetail && (
            <WordAccentMapContainer
              wordId={parseInt(wordId)}
              headword={wordDetail.headword}
              reading={wordDetail.reading}
              className="mt-4"
            />
          )}
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
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-8.716 0m8.716 0A9.004 9.004 0 0112 3c2.53 0 4.82 1.044 6.456 2.726m-8.772 8.616a9.004 9.004 0 01-6.456-2.726 8.99 8.99 0 010-7.89m6.456 10.616L3.228 4.726" />
              </svg>
              SNSでシェアする
            </button>
          </div>
        </div>
      </div>

      {/* シェアモーダル */}
      {wordDetail && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          word={wordDetail}
          userVoteResult={
            canVoteData?.hasVoted ? {
              accentType: wordDetail.nationalStats[0]?.accentType || 'heiban',
              prefecture: selectedPrefecture
            } : undefined
          }
        />
      )}
    </div>
  );
}