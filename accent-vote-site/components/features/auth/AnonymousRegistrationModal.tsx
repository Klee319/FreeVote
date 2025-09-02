'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnonymousRegistrationForm from './AnonymousRegistrationForm';
import { useCookieAuth } from '@/hooks/useCookieAuth';

interface AnonymousRegistrationModalProps {
  isForceOpen?: boolean;
  onForceClose?: () => void;
}

export default function AnonymousRegistrationModal({ 
  isForceOpen = false, 
  onForceClose 
}: AnonymousRegistrationModalProps) {
  const { isRegistered, isLoading, verifyCookie } = useCookieAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 外部から強制的に開く場合
    if (isForceOpen) {
      setIsOpen(true);
      return;
    }
    
    // 初回のみ表示（既に表示済みの場合はスキップ）
    if (!isLoading && !isRegistered && !hasShownOnce) {
      const hasSkipped = sessionStorage.getItem('registration-skipped');
      if (!hasSkipped) {
        setIsOpen(true);
        setHasShownOnce(true);
      }
    }
  }, [isRegistered, isLoading, hasShownOnce, isForceOpen]);

  const handleSuccess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      sessionStorage.removeItem('registration-skipped');
      // 登録成功後に認証状態を再確認
      await verifyCookie();
      setIsOpen(false);
      if (onForceClose) {
        onForceClose();
      }
    } catch (error) {
      console.error('[AnonymousRegistrationModal] Error handling success:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    if (isProcessing) return;
    
    setIsOpen(false);
    if (!isForceOpen) {
      sessionStorage.setItem('registration-skipped', 'true');
    }
    if (onForceClose) {
      onForceClose();
    }
  };

  // 強制表示でない場合は、登録済みまたはローディング中は表示しない
  if (!isForceOpen && (isLoading || isRegistered)) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (!isProcessing) {
      setIsOpen(open);
      if (!open && onForceClose) {
        onForceClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => isProcessing && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>ようこそ！</DialogTitle>
          <DialogDescription>
            より良いサービスを提供するため、簡単なアンケートにご協力ください。
          </DialogDescription>
        </DialogHeader>
        <AnonymousRegistrationForm 
          onSuccess={handleSuccess}
          onSkip={handleSkip}
          disabled={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
}