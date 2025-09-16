'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type ReportReason = 'inappropriate' | 'incorrect' | 'other';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wordId: number;
  headword: string;
  onReport: (reason: ReportReason, details: string) => Promise<void>;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { 
    value: 'inappropriate', 
    label: '不適切な内容',
    description: '差別的、攻撃的、または不適切な内容が含まれている'
  },
  { 
    value: 'incorrect', 
    label: '誤った情報',
    description: '読み方、モーラ分割、その他の情報が間違っている'
  },
  { 
    value: 'other', 
    label: 'その他',
    description: '上記以外の問題がある'
  }
];

export function ReportDialog({ 
  open, 
  onOpenChange, 
  wordId, 
  headword, 
  onReport 
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      setError('報告理由を選択してください');
      return;
    }

    if (reason === 'other' && !details.trim()) {
      setError('その他を選択した場合は詳細を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onReport(reason, details);
      setSuccess(true);
      
      // 成功メッセージを表示してからダイアログを閉じる
      setTimeout(() => {
        onOpenChange(false);
        // リセット
        setReason('inappropriate');
        setDetails('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '報告の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) {
        // ダイアログが閉じられた時にリセット
        setReason('inappropriate');
        setDetails('');
        setError(null);
        setSuccess(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>問題を報告</DialogTitle>
          <DialogDescription>
            「{headword}」に関する問題を報告してください
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6">
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                報告を受け付けました。ご協力ありがとうございます。
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label>報告理由</Label>
                <RadioGroup
                  value={reason}
                  onValueChange={(value: string) => setReason(value as ReportReason)}
                  disabled={isSubmitting}
                >
                  {REPORT_REASONS.map((item) => (
                    <div key={item.value} className="flex items-start space-x-3 py-2">
                      <RadioGroupItem value={item.value} id={item.value} className="mt-1" />
                      <div className="space-y-1">
                        <Label 
                          htmlFor={item.value} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {item.label}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">
                  詳細（任意）
                  {reason === 'other' && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  id="details"
                  placeholder="問題の詳細を記入してください..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '報告する'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}