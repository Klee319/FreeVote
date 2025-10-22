'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCommentCreate } from '@/hooks/useCommentCreate';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  pollId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  showCancelButton?: boolean;
}

export function CommentForm({
  pollId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'コメントを入力...',
  showCancelButton = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const { createComment, isCreating } = useCommentCreate();
  const maxLength = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > maxLength || isCreating) return;

    const success = await createComment({
      pollId,
      content: content.trim(),
      parentId,
    });

    if (success) {
      setContent('');
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] resize-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
        disabled={isCreating}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm transition-colors',
            content.length > maxLength
              ? 'text-destructive font-semibold'
              : 'text-muted-foreground'
          )}
        >
          {content.length} / {maxLength}
        </span>
        <div className="flex gap-2">
          {showCancelButton && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isCreating}
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || content.length > maxLength || isCreating}
            className="min-w-[100px] transition-all"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                投稿
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}