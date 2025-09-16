'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Vote,
  Calendar,
  Users,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Poll {
  id: number;
  title: string;
  description?: string;
  options: string[];
  isAccentMode: boolean;
  totalVotes: number;
  voteCount: number;
  status: 'active' | 'ended' | 'draft';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function PollsManagementContent() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPolls();
  }, [currentPage, selectedStatus]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/admin/polls?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // APIレスポンスの構造に合わせて修正
        const pollsData = data.data || [];
        // voteCountをtotalVotesにマッピング
        const mappedPolls = pollsData.map((poll: any) => ({
          ...poll,
          totalVotes: poll.voteCount || 0
        }));
        setPolls(mappedPolls);
        setTotalPages(data.totalPages || Math.ceil(pollsData.length / 20) || 1);
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この投票を削除してもよろしいですか？関連する投票データも全て削除されます。')) return;

    try {
      const response = await fetch(`/api/admin/polls/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchPolls();
      }
    } catch (error) {
      console.error('Failed to delete poll:', error);
    }
  };

  const getStatusBadge = (status: string, deadline?: string) => {
    // 締切日時から状態を判定
    if (deadline) {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      if (deadlineDate < now) {
        status = 'ended';
      }
    }

    const statusConfig = {
      active: { label: '実施中', variant: 'default' as const },
      ended: { label: '終了', variant: 'secondary' as const },
      draft: { label: '下書き', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredPolls = polls.filter(poll =>
    poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poll.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && polls.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">実施中の投票</p>
                <p className="text-2xl font-bold mt-1">
                  {polls.filter(p => {
                    if (p.deadline) {
                      return new Date(p.deadline) > new Date();
                    }
                    return p.status === 'active';
                  }).length}
                </p>
              </div>
              <Vote className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総投票数</p>
                <p className="text-2xl font-bold mt-1">
                  {formatNumber(polls.reduce((sum, p) => sum + p.totalVotes, 0))}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均投票数</p>
                <p className="text-2xl font-bold mt-1">
                  {polls.length > 0
                    ? formatNumber(Math.round(polls.reduce((sum, p) => sum + p.totalVotes, 0) / polls.length))
                    : 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* アクションバー */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
          <Link href="/admin/polls/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>

      {/* フィルターバー */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="投票を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">全ての状態</option>
              <option value="active">実施中</option>
              <option value="ended">終了済み</option>
              <option value="draft">下書き</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              詳細フィルター
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 投票テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>投票一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>選択肢数</TableHead>
                <TableHead>モード</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>投票数</TableHead>
                <TableHead>締切</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell className="font-mono">{poll.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{poll.title}</p>
                      {poll.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {poll.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{poll.options.length}</TableCell>
                  <TableCell>
                    <Badge variant={poll.isAccentMode ? 'default' : 'outline'}>
                      {poll.isAccentMode ? 'アクセント' : '通常'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(poll.status, poll.deadline)}
                  </TableCell>
                  <TableCell>{formatNumber(poll.totalVotes)}</TableCell>
                  <TableCell>
                    {poll.deadline ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {format(new Date(poll.deadline), 'MM/dd HH:mm', { locale: ja })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(poll.createdAt), 'yyyy/MM/dd', { locale: ja })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/polls/${poll.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(poll.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPolls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              投票が見つかりませんでした
            </div>
          )}

          {/* ページネーション */}
          {filteredPolls.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {totalPages} ページ中 {currentPage} ページ目を表示
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}