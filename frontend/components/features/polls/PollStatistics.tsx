'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Poll } from '@/types';
import { usePolls } from '@/hooks/usePolls';
import { BarChart as BarChartIcon, MapPin, Users, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PollStatisticsProps {
  poll: Poll;
  selectedOption: number | null;
  isAuthenticated: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PollStatistics({
  poll,
  selectedOption,
  isAuthenticated,
}: PollStatisticsProps) {
  const { fetchPollStatistics, currentStatistics } = usePolls();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (poll.id && isAuthenticated) {
      setIsLoadingStats(true);
      fetchPollStatistics(poll.id).finally(() => {
        setIsLoadingStats(false);
      });
    }
  }, [poll.id, isAuthenticated, fetchPollStatistics]);

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

  // Prepare data for charts
  const prepareChartData = () => {
    return poll.options.map((option, index) => ({
      name: option.label,
      value: poll.voteDistribution?.[index] || 0,
      percentage: calculatePercentage(poll.voteDistribution?.[index] || 0, totalVotes),
    }));
  };

  const prepareAgeChartData = () => {
    if (!currentStatistics?.breakdown?.age) return [];

    const ageGroups = Object.keys(currentStatistics.breakdown.age);
    return poll.options.map((option, index) => {
      const data: Record<string, string | number> = {
        name: option.label,
      };
      ageGroups.forEach((age) => {
        data[age] = currentStatistics.breakdown?.age?.[age]?.[index] || 0;
      });
      return data;
    });
  };

  const prepareGenderChartData = () => {
    if (!currentStatistics?.breakdown?.gender) return [];

    return Object.entries(currentStatistics.breakdown.gender).map(([gender, distribution]) => {
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      return poll.options.map((option, index) => ({
        gender: gender === 'male' ? '男性' : gender === 'female' ? '女性' : 'その他',
        option: option.label,
        value: distribution[index] || 0,
        percentage: calculatePercentage(distribution[index] || 0, total),
      }));
    }).flat();
  };

  const chartData = prepareChartData();
  const ageChartData = prepareAgeChartData();
  const genderChartData = prepareGenderChartData();

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5" />
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
                        ({voteCount.toLocaleString()}票)
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
              <span className="font-bold">{totalVotes.toLocaleString()}票</span>
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
                <TabsTrigger value="overview">概要</TabsTrigger>
                <TabsTrigger value="age">年代別</TabsTrigger>
                <TabsTrigger value="gender">性別</TabsTrigger>
                <TabsTrigger value="prefecture">都道府県</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  {/* Pie Chart */}
                  <div>
                    <h4 className="font-medium mb-4">投票分布</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart */}
                  <div>
                    <h4 className="font-medium mb-4">選択肢別投票数</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="age" className="mt-6">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : currentStatistics?.breakdown?.age && ageChartData.length > 0 ? (
                  <div className="space-y-6">
                    <h4 className="font-medium">年代別投票分布</h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={ageChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {Object.keys(currentStatistics.breakdown.age).map((age, index) => (
                          <Bar key={age} dataKey={age} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Detailed breakdown by age group */}
                    <div className="space-y-4">
                      {Object.entries(currentStatistics.breakdown.age).map(([ageGroup, distribution]) => {
                        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
                        return (
                          <div key={ageGroup} className="space-y-2">
                            <h5 className="font-medium text-sm">{ageGroup}</h5>
                            <div className="space-y-1">
                              {poll.options.map((option, index) => {
                                const votes = distribution[index] || 0;
                                const percentage = calculatePercentage(votes, total);
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-sm w-32 truncate">{option.label}</span>
                                    <Progress value={percentage} className="flex-1 h-2" />
                                    <span className="text-xs w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    年代別データがありません
                  </p>
                )}
              </TabsContent>

              <TabsContent value="gender" className="mt-6">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : currentStatistics?.breakdown?.gender && Object.keys(currentStatistics.breakdown.gender).length > 0 ? (
                  <div className="space-y-6">
                    <h4 className="font-medium">性別投票分布</h4>

                    {/* Gender distribution for each option */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(currentStatistics.breakdown.gender).map(([gender, distribution]) => {
                        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
                        const genderLabel = gender === 'male' ? '男性' : gender === 'female' ? '女性' : 'その他';

                        return (
                          <Card key={gender}>
                            <CardHeader className="pb-3">
                              <h5 className="font-medium text-sm">{genderLabel}</h5>
                              <p className="text-xs text-muted-foreground">
                                総投票数: {total.toLocaleString()}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {poll.options.map((option, index) => {
                                const votes = distribution[index] || 0;
                                const percentage = calculatePercentage(votes, total);
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="truncate">{option.label}</span>
                                      <span className="font-medium">{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    性別データがありません
                  </p>
                )}
              </TabsContent>

              <TabsContent value="prefecture" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      都道府県ごとの投票傾向
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/polls/${poll.id}/map`}>
                        <MapPin className="h-4 w-4 mr-2" />
                        地図で見る
                      </Link>
                    </Button>
                  </div>

                  {isLoadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : currentStatistics?.breakdown?.prefecture ? (
                    <div className="space-y-2">
                      {/* Top 10 prefectures by vote count */}
                      {(() => {
                        const prefectures = Object.entries(currentStatistics.breakdown.prefecture)
                          .map(([prefecture, distribution]) => {
                            const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
                            const topOptionIndex = Object.entries(distribution).reduce(
                              (max, [option, count]) =>
                                count > (distribution[max] || 0) ? parseInt(option) : max,
                              0
                            );
                            return {
                              prefecture,
                              total,
                              topOption: poll.options[topOptionIndex]?.label || '不明',
                            };
                          })
                          .sort((a, b) => b.total - a.total)
                          .slice(0, 10);

                        return (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm mb-3">投票数上位10都道府県</h5>
                            {prefectures.map(({ prefecture, total, topOption }) => (
                              <div key={prefecture} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span className="font-medium">{prefecture}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    1位: {topOption}
                                  </span>
                                  <span className="text-sm">
                                    {total.toLocaleString()}票
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      地域別データを読み込めませんでした
                    </p>
                  )}
                </div>
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
              グラフでの可視化機能をご利用いただけます。
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