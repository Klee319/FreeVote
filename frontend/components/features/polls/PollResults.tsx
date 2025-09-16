'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Poll, PollStatistics } from '@/types';
import { usePolls } from '@/hooks/usePolls';
import { BarChart, MapPin, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface PollResultsProps {
  poll: Poll;
  selectedOption: number | null;
  isAuthenticated: boolean;
}

export function PollResults({
  poll,
  selectedOption,
  isAuthenticated,
}: PollResultsProps) {
  const { fetchPollStatistics, currentStatistics } = usePolls();
  const [activeTab, setActiveTab] = useState('total');

  useEffect(() => {
    if (poll.id) {
      fetchPollStatistics(poll.id);
    }
  }, [poll.id, fetchPollStatistics]);

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getWinnerIndex = () => {
    if (!poll.voteDistribution) return -1;

    let maxVotes = 0;
    let winnerIndex = -1;

    Object.entries(poll.voteDistribution).forEach(([index, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winnerIndex = parseInt(index);
      }
    });

    return winnerIndex;
  };

  const winnerIndex = getWinnerIndex();
  const totalVotes = poll.totalVotes || 0;

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            投票結果
          </CardTitle>
          {selectedOption !== null && (
            <div className="text-sm text-muted-foreground">
              あなたは「{poll.options[selectedOption].label}」に投票しました
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poll.options.map((option, index) => {
              const voteCount = poll.voteDistribution?.[index] || 0;
              const percentage = calculatePercentage(voteCount, totalVotes);
              const isWinner = index === winnerIndex;
              const isYourVote = index === selectedOption;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {isWinner && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                          1位
                        </span>
                      )}
                      {isYourVote && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          あなたの選択
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{percentage}%</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({voteCount}票)
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">総投票数</span>
              <span className="font-bold">{totalVotes}票</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics (for authenticated users) */}
      {isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>詳細統計</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="total">総合</TabsTrigger>
                <TabsTrigger value="age">年代別</TabsTrigger>
                <TabsTrigger value="gender">性別</TabsTrigger>
                <TabsTrigger value="prefecture">都道府県</TabsTrigger>
              </TabsList>

              <TabsContent value="total" className="mt-4">
                <p className="text-muted-foreground">
                  上記の総合結果をご覧ください。
                </p>
              </TabsContent>

              <TabsContent value="age" className="mt-4">
                {currentStatistics?.byAge ? (
                  <div className="space-y-3">
                    {Object.entries(currentStatistics.byAge).map(([ageGroup, distribution]) => (
                      <div key={ageGroup} className="space-y-2">
                        <h4 className="font-medium">{ageGroup}</h4>
                        <div className="space-y-1">
                          {poll.options.map((option, index) => {
                            const votes = distribution[index] || 0;
                            const total = Object.values(distribution).reduce((a, b) => a + b, 0);
                            const percentage = calculatePercentage(votes, total);
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm w-24 truncate">{option.label}</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-xs w-10 text-right">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">年代別データを読み込み中...</p>
                )}
              </TabsContent>

              <TabsContent value="gender" className="mt-4">
                {currentStatistics?.byGender ? (
                  <div className="space-y-3">
                    {Object.entries(currentStatistics.byGender).map(([gender, distribution]) => (
                      <div key={gender} className="space-y-2">
                        <h4 className="font-medium">
                          {gender === 'male' ? '男性' : gender === 'female' ? '女性' : 'その他'}
                        </h4>
                        <div className="space-y-1">
                          {poll.options.map((option, index) => {
                            const votes = distribution[index] || 0;
                            const total = Object.values(distribution).reduce((a, b) => a + b, 0);
                            const percentage = calculatePercentage(votes, total);
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm w-24 truncate">{option.label}</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-xs w-10 text-right">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">性別データを読み込み中...</p>
                )}
              </TabsContent>

              <TabsContent value="prefecture" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    都道府県ごとの投票傾向
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/polls/${poll.id}/stats`}>
                      <MapPin className="h-4 w-4 mr-2" />
                      地図で見る
                    </Link>
                  </Button>
                </div>
                {currentStatistics?.byPrefecture ? (
                  <p className="text-sm text-muted-foreground">
                    詳細な地域別統計は地図表示ページでご覧ください。
                  </p>
                ) : (
                  <p className="text-muted-foreground">地域別データを読み込み中...</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">詳細統計を見るには登録が必要です</h3>
            <p className="text-sm text-muted-foreground mb-4">
              年代別・性別・地域別の詳細な統計情報や、
              <br />
              地図での可視化機能をご利用いただけます。
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/register">無料で登録</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/login">ログイン</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}