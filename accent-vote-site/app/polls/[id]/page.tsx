'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart2, 
  Users, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStatus } from '@/hooks/useUserStatus';
import { PollDetail, PollVote } from '@/types/polls';

// ステータスに応じた色を返す
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'ended':
      return 'bg-gray-500';
    case 'draft':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

// ステータスに応じたラベルを返す
function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return '投票受付中';
    case 'ended':
      return '終了';
    case 'draft':
      return '下書き';
    default:
      return '';
  }
}

// カテゴリに応じたラベルを返す
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: '一般',
    tech: '技術',
    culture: '文化',
    lifestyle: 'ライフスタイル',
    entertainment: 'エンタメ',
    education: '教育',
    business: 'ビジネス',
    other: 'その他'
  };
  return labels[category] || category;
}

// 投票詳細ページコンポーネント
export default function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUserStatus();
  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [voteReason, setVoteReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pollId, setPollId] = useState<string>('');

  // paramsを解決
  useEffect(() => {
    const resolveParams = async () => {
      const { id } = await params;
      setPollId(id);
    };
    resolveParams();
  }, [params]);

  // 投票詳細データ取得
  useEffect(() => {
    if (!pollId) return;
    
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`);
        const data = await response.json();
        
        if (data.success) {
          setPoll(data.poll);
          // 既に投票済みの場合、選択した選択肢を設定
          if (data.poll.userVote) {
            setSelectedOptions(data.poll.userVote.optionIds);
            setVoteReason(data.poll.userVote.reason || '');
          }
        } else {
          setError('投票データの取得に失敗しました');
        }
      } catch (error) {
        console.error('投票データの取得エラー:', error);
        setError('投票データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoll();
  }, [pollId]);

  // 選択肢の選択処理
  const handleOptionSelect = (optionId: number) => {
    if (!poll) return;
    
    if (poll.type === 'single') {
      // 単一選択
      setSelectedOptions([optionId]);
    } else {
      // 複数選択
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    }
  };

  // 投票送信処理
  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      setError('選択肢を選んでください');
      return;
    }
    
    if (poll?.requireReason && !voteReason.trim()) {
      setError('理由を入力してください');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const voteData: PollVote = {
        pollId: poll!.id,
        optionIds: selectedOptions,
        reason: voteReason || undefined,
        deviceId: localStorage.getItem('deviceId') || undefined,
      };
      
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        // 結果ページへ遷移
        setTimeout(() => {
          router.push(`/polls/${pollId}/results`);
        }, 1500);
      } else {
        setError(data.message || '投票に失敗しました');
      }
    } catch (error) {
      console.error('投票送信エラー:', error);
      setError('投票の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 残り時間計算
  const calculateTimeLeft = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return '終了';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `あと${days}日`;
    if (hours > 0) return `あと${hours}時間`;
    return 'まもなく終了';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            投票が見つかりませんでした
          </AlertDescription>
        </Alert>
        <Link href="/polls">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            投票一覧に戻る
          </Button>
        </Link>
      </div>
    );
  }

  const isActive = poll.status === 'active';
  const hasVoted = poll.hasVoted;
  const canVote = isActive && poll.canVote && !hasVoted;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 戻るボタン */}
      <Link href="/polls">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          投票一覧に戻る
        </Button>
      </Link>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <Badge variant="outline">
                  {getCategoryLabel(poll.category)}
                </Badge>
                <Badge className={`${getStatusColor(poll.status)} text-white`}>
                  {getStatusLabel(poll.status)}
                </Badge>
              </div>
              
              <CardTitle className="text-3xl">{poll.title}</CardTitle>
              
              {poll.description && (
                <CardDescription className="text-base mt-4 whitespace-pre-wrap">
                  {poll.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent>
              {/* 投票フォームまたは結果表示 */}
              {success ? (
                <Alert className="mb-6">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    投票が完了しました！結果ページへ移動します...
                  </AlertDescription>
                </Alert>
              ) : hasVoted ? (
                <Alert className="mb-6">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    既に投票済みです。
                    <Link href={`/polls/${pollId}/results`} className="underline ml-1">
                      結果を見る
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : !isActive ? (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    この投票は終了しました。
                    <Link href={`/polls/${pollId}/results`} className="underline ml-1">
                      結果を見る
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : null}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 選択肢 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">選択肢</h3>
                
                {poll.type === 'single' ? (
                  <RadioGroup
                    value={selectedOptions[0]?.toString()}
                    onValueChange={(value) => handleOptionSelect(parseInt(value))}
                    disabled={!canVote || submitting}
                  >
                    {poll.options.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 py-3 border-b last:border-0">
                        <RadioGroupItem
                          value={option.id.toString()}
                          id={`option-${option.id}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{option.text}</div>
                          {option.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {poll.options.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 py-3 border-b last:border-0">
                        <Checkbox
                          id={`option-${option.id}`}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleOptionSelect(option.id)}
                          disabled={!canVote || submitting}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{option.text}</div>
                          {option.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 理由入力欄 */}
              {poll.requireReason && canVote && (
                <div className="mt-6 space-y-2">
                  <Label htmlFor="reason">
                    投票理由 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="投票理由を入力してください..."
                    value={voteReason}
                    onChange={(e) => setVoteReason(e.target.value)}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>

            {canVote && (
              <CardFooter>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedOptions.length === 0 || submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? '送信中...' : '投票する'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 統計情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">投票情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>参加者数</span>
                </div>
                <span className="font-semibold">{poll.uniqueVoters}人</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart2 className="h-4 w-4" />
                  <span>総投票数</span>
                </div>
                <span className="font-semibold">{poll.totalVotes}票</span>
              </div>
              
              {poll.startDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>開始日</span>
                  </div>
                  <span className="text-sm">{formatDate(poll.startDate)}</span>
                </div>
              )}
              
              {poll.endDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>終了まで</span>
                  </div>
                  <span className="font-semibold text-orange-600">
                    {calculateTimeLeft(poll.endDate)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* アクション */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/polls/${pollId}/results`)}
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                結果を見る
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // シェア機能の実装
                  if (navigator.share) {
                    navigator.share({
                      title: poll.title,
                      text: poll.description,
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                シェア
              </Button>
            </CardContent>
          </Card>

          {/* タグ */}
          {poll.tags && poll.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">タグ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {poll.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}