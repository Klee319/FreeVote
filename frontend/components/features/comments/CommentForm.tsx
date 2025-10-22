'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCommentCreate } from '@/hooks/useCommentCreate';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  pollId: string;
  userToken?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CommentForm({
  pollId,
  userToken,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const { createComment, isCreating } = useCommentCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    const success = await createComment({
      pollId,
      content: content.trim(),
      userToken,
    });

    if (success) {
      setContent('');
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="コメントを入力してください..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isCreating}
        className="min-h-[100px] resize-none"
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/500
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCreating}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isCreating}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            投稿
          </Button>
        </div>
      </div>
    </form>
  );
}