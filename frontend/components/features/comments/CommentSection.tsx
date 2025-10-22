'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '@/hooks/useComments';
import { useAuthStore } from '@/stores/authStore';
import type { Comment } from '@/types';

interface CommentSectionProps {
  pollId: string;
  userToken?: string;
}

export function CommentSection({ pollId, userToken }: CommentSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { comments, totalPages, isLoading, fetchComments } = useComments(pollId);

  useEffect(() => {
    fetchComments(currentPage);
  }, [currentPage, pollId, fetchComments]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            コメント ({comments.length})
          </CardTitle>
          {!showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              コメントを投稿
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6">
            <CommentForm
              pollId={pollId}
              userToken={userToken}
              onSubmit={handleCommentAdded}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <CommentList
          comments={comments}
          pollId={pollId}
          userToken={userToken}
          isLoading={isLoading}
          onCommentUpdate={handleCommentAdded}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}