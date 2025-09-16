'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingUser {
  id: string;
  username: string;
  referralCount: number;
  rank: number;
}

export function RankingSection() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setRankings([
        { id: '1', username: 'ユーザー1', referralCount: 156, rank: 1 },
        { id: '2', username: 'ユーザー2', referralCount: 142, rank: 2 },
        { id: '3', username: 'ユーザー3', referralCount: 98, rank: 3 },
        { id: '4', username: 'ユーザー4', referralCount: 67, rank: 4 },
        { id: '5', username: 'ユーザー5', referralCount: 45, rank: 5 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadge = (referralCount: number) => {
    if (referralCount >= 100) return { name: 'プラチナ', color: 'bg-purple-500' };
    if (referralCount >= 50) return { name: 'ゴールド', color: 'bg-yellow-500' };
    if (referralCount >= 20) return { name: 'シルバー', color: 'bg-gray-400' };
    if (referralCount >= 5) return { name: 'ブロンズ', color: 'bg-orange-600' };
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {rankings.map((user) => {
            const badge = getRankBadge(user.referralCount);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    {badge && (
                      <Badge className={`${badge.color} text-white text-xs mt-1`}>
                        {badge.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{user.referralCount}人</div>
                  <div className="text-xs text-muted-foreground">紹介</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}