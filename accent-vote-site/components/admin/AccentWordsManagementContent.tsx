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
  FileText,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

interface Word {
  id: number;
  headword: string;
  reading: string;
  category: string;
  moraCount: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

export default function AccentWordsManagementContent() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWords();
  }, [currentPage, selectedCategory]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      });

      const response = await fetch(`/api/admin/words?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWords(data.words);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この単語を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/words/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchWords();
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: '一般',
      technical: '専門用語',
      dialect: '方言',
      proper_noun: '固有名詞',
    };
    return labels[category] || category;
  };

  const filteredWords = words.filter(word =>
    word.headword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.reading.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && words.length === 0) {
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
                <p className="text-sm text-gray-600">登録単語数</p>
                <p className="text-2xl font-bold mt-1">
                  {formatNumber(words.length)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総投票数</p>
                <p className="text-2xl font-bold mt-1">
                  {formatNumber(words.reduce((sum, w) => sum + w.totalVotes, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均投票数</p>
                <p className="text-2xl font-bold mt-1">
                  {words.length > 0
                    ? formatNumber(Math.round(words.reduce((sum, w) => sum + w.totalVotes, 0) / words.length))
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
          <Link href="/admin/words/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規追加
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
                  placeholder="単語を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">全カテゴリ</option>
              <option value="general">一般</option>
              <option value="technical">専門用語</option>
              <option value="dialect">方言</option>
              <option value="proper_noun">固有名詞</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              詳細フィルター
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 単語テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>単語一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>見出し語</TableHead>
                <TableHead>読み</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>モーラ数</TableHead>
                <TableHead>投票数</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-mono">{word.id}</TableCell>
                  <TableCell className="font-medium">{word.headword}</TableCell>
                  <TableCell>{word.reading}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                      {getCategoryLabel(word.category)}
                    </span>
                  </TableCell>
                  <TableCell>{word.moraCount}</TableCell>
                  <TableCell>{formatNumber(word.totalVotes)}</TableCell>
                  <TableCell>
                    {new Date(word.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/words/${word.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(word.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredWords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              単語が見つかりませんでした
            </div>
          )}

          {/* ページネーション */}
          {filteredWords.length > 0 && (
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