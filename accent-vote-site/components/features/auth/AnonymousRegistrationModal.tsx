'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnonymousRegistrationForm from './AnonymousRegistrationForm';
import { useCookieAuth } from '@/hooks/useCookieAuth';

export default function AnonymousRegistrationModal() {
  const { isRegistered, isLoading } = useCookieAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  useEffect(() => {
    // 初回のみ表示（既に表示済みの場合はスキップ）
    if (!isLoading && !isRegistered && !hasShownOnce) {
      const hasSkipped = sessionStorage.getItem('registration-skipped');
      if (!hasSkipped) {
        setIsOpen(true);
        setHasShownOnce(true);
      }
    }
  }, [isRegistered, isLoading, hasShownOnce]);

  const handleSuccess = () => {
    setIsOpen(false);
    sessionStorage.removeItem('registration-skipped');
  };

  const handleSkip = () => {
    setIsOpen(false);
    sessionStorage.setItem('registration-skipped', 'true');
  };

  // 登録済みまたはローディング中は表示しない
  if (isLoading || isRegistered) {
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