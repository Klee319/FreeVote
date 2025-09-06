'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Square, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Poll, PollOption, SubmitVoteRequest } from '@/types/poll';
import { useToast } from '@/components/ui/use-toast';

interface PollVotingFormProps {
  poll: Poll;
  onSubmit: (data: SubmitVoteRequest) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PollVotingForm({
  poll,
  onSubmit,
  disabled = false,
  className,
}: PollVotingFormProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const isSingleChoice = poll.type === 'single';
  const maxChoices = poll.maxChoices || poll.options.length;

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (selectedOptions.length === 0) {
      newErrors.options = '少なくとも1つの選択肢を選んでください';
    }

    if (!isSingleChoice && poll.maxChoices && selectedOptions.length > poll.maxChoices) {
      newErrors.options = `最大${poll.maxChoices}個まで選択可能です`;
    }

    if (poll.requireReason && !reason.trim()) {
      newErrors.reason = '投票理由を入力してください';
    }

    if (poll.requireReason && reason.trim().length < 10) {
      newErrors.reason = '投票理由は10文字以上で入力してください';
    }

    if (reason.length > 500) {
      newErrors.reason = '投票理由は500文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedOptions, reason, isSingleChoice, poll.maxChoices, poll.requireReason]);

  const handleSingleOptionChange = (optionId: string) => {
    setSelectedOptions([parseInt(optionId)]);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.options;
      return newErrors;
    });
  };

  const handleMultipleOptionChange = (optionId: number, checked: boolean) => {
    setSelectedOptions((prev) => {
      const newSelection = checked
        ? [...prev, optionId]
        : prev.filter((id) => id !== optionId);

      if (poll.maxChoices && newSelection.length > poll.maxChoices) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          options: `最大${poll.maxChoices}個まで選択可能です`,
        }));
        return prev;
      }

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.options;
        return newErrors;
      });
      return newSelection;
    });
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.reason;
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'エラー',
        description: '入力内容を確認してください',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        pollId: poll.id,
        optionIds: selectedOptions,
        reason: reason.trim() || undefined,
      });

      toast({
        title: '投票完了',
        description: '投票が正常に送信されました',
      });

      // フォームをリセット
      setSelectedOptions([]);
      setReason('');
      setErrors({});
    } catch (error) {
      console.error('投票の送信に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '投票の送信に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOption = (option: PollOption) => {
    const isSelected = selectedOptions.includes(option.id);

    if (isSingleChoice) {
      return (
        <motion.div
          key={option.id}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Card
            className={cn(
              'cursor-pointer transition-all duration-200',
              isSelected && 'ring-2 ring-primary-500 bg-primary-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value={option.id.toString()}
                  id={`option-${option.id}`}
                  disabled={disabled || isSubmitting}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={`option-${option.id}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {option.text}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={option.id}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card
          className={cn(
            'cursor-pointer transition-all duration-200',
            isSelected && 'ring-2 ring-primary-500 bg-primary-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && !isSubmitting && handleMultipleOptionChange(option.id, !isSelected)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id={`option-${option.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleMultipleOptionChange(option.id, checked as boolean)}
                disabled={disabled || isSubmitting}
                className="mt-0.5"
                aria-label={`選択肢: ${option.text}`}
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`option-${option.id}`}
                  className="text-base font-medium cursor-pointer"
                >
                  {option.text}
                </Label>
                {option.description && (
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* 選択肢 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            選択肢
            {!isSingleChoice && poll.maxChoices && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (最大{poll.maxChoices}個まで選択可)
              </span>
            )}
          </Label>
          {!isSingleChoice && (
            <span className="text-sm text-muted-foreground">
              {selectedOptions.length}/{maxChoices} 選択中
            </span>
          )}
        </div>

        {errors.options && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.options}</AlertDescription>
          </Alert>
        )}

        {isSingleChoice ? (
          <RadioGroup
            value={selectedOptions[0]?.toString() || ''}
            onValueChange={handleSingleOptionChange}
            disabled={disabled || isSubmitting}
            className="space-y-3"
          >
            {poll.options.map(renderOption)}
          </RadioGroup>
        ) : (
          <div className="space-y-3">
            {poll.options.map(renderOption)}
          </div>
        )}
      </div>

      {/* 投票理由 */}
      {(poll.requireReason || reason) && (
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-base font-semibold">
            投票理由
            {poll.requireReason && (
              <span className="ml-1 text-sm text-destructive">*</span>
            )}
          </Label>
          {errors.reason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.reason}</AlertDescription>
            </Alert>
          )}
          <Textarea
            id="reason"
            value={reason}
            onChange={handleReasonChange}
            placeholder="投票理由を入力してください（10文字以上500文字以内）"
            rows={4}
            disabled={disabled || isSubmitting}
            className={cn(
              'resize-none',
              errors.reason && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? 'reason-error' : undefined}
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {reason.length}/500
            </span>
          </div>
        </div>
      )}

      {/* 送信ボタン */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || isSubmitting || selectedOptions.length === 0}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            送信中...
          </>
        ) : (
          '投票する'
        )}
      </Button>

      {/* 注意事項 */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>※ 一度投票すると変更できません</p>
        {poll.voteVisibility === 'public' && (
          <p>※ この投票は公開投票です。投票結果は他のユーザーに表示されます</p>
        )}
        {poll.voteVisibility === 'after_vote' && (
          <p>※ 投票後に結果を確認できます</p>
        )}
      </div>
    </form>
  );
}