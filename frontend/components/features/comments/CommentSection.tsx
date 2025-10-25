'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronLeft, ChevronRight, Clock, TrendingUp, LogIn } from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '@/hooks/useComments';
import { useAuthStore } from '@/stores/authStore';
import type { Comment } from '@/types';

interface CommentSectionProps {
  pollId: string;
}

export function CommentSection({ pollId }: CommentSectionProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'new' | 'popular'>('new');
  const { isAuthenticated, user } = useAuthStore();
  const { comments, totalPages, isLoading, fetchComments } = useComments(pollId, sortBy);

  useEffect(() => {
    fetchComments(currentPage);
  }, [currentPage, pollId, fetchComments]);

  // sortBy変更時にページを1にリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const handleCommentAdded = () => {
    // Refresh comments after adding new comment
    fetchComments(currentPage);
    setShowForm(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSortChange = (newSort: 'new' | 'popular') => {
    setSortBy(newSort);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
              コメント ({comments.length})
            </CardTitle>
            {!showForm && (
              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
                onClick={() => {
                  if (isAuthenticated) {
                    setShowForm(true);
                  } else {
                    router.push('/auth/login');
                  }
                }}
              >
                {isAuthenticated ? (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    コメントを投稿
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    ログインしてコメント
                  </>
                )}
              </Button>
            )}
          </div>
          {/* ソート切り替えボタン */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant={sortBy === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('new')}
              className="flex-1 sm:flex-initial gap-1.5"
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs sm:text-sm">新着順</span>
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('popular')}
              className="flex-1 sm:flex-initial gap-1.5"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs sm:text-sm">人気順</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6">
            <CommentForm
              pollId={pollId}
              onSuccess={handleCommentAdded}
              onCancel={() => setShowForm(false)}
              showCancelButton={true}
            />
          </div>
        )}

        <CommentList
          comments={comments}
          pollId={pollId}
          isLoading={isLoading}
          onCommentUpdate={handleCommentAdded}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">前へ</span>
            </Button>
            {/* デスクトップ: ページ番号ボタン表示 */}
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                if (pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            {/* モバイル: ページ数テキスト表示 */}
            <div className="sm:hidden text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="mr-1">次へ</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}