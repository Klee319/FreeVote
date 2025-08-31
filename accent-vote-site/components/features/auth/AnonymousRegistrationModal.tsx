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
  const { isRegistered, isLoading } = useCookieAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

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

  const handleSuccess = () => {
    setIsOpen(false);
    sessionStorage.removeItem('registration-skipped');
    if (onForceClose) {
      onForceClose();
    }
  };

  const handleSkip = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ようこそ！</DialogTitle>
          <DialogDescription>
            より良いサービスを提供するため、簡単なアンケートにご協力ください。
          </DialogDescription>
        </DialogHeader>
        <AnonymousRegistrationForm 
          onSuccess={handleSuccess}
          onSkip={handleSkip}
        />
      </DialogContent>
    </Dialog>
  );
}