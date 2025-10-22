'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Poll } from '@/types';
import { usePolls } from '@/hooks/usePolls';
import { useStatsAccess } from '@/hooks/useStatsAccess';
import { useAuthStore } from '@/stores/authStore';
import { Copy, Twitter, Facebook, Link2, CheckCircle2 } from 'lucide-react';

interface ShareDialogProps {
  poll: Poll;
  selectedOption: number | null;
  onClose: () => void;
}

export function ShareDialog({ poll, selectedOption, onClose }: ShareDialogProps) {
  const { getShareMessage } = usePolls();
  const { grantAccess, hasAccess } = useStatsAccess(poll.id);
  const { user } = useAuthStore();
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  useEffect(() => {
    const generateShareContent = async () => {
      // Generate share URL with referral tracking
      const baseUrl = window.location.origin;
      const pollUrl = `${baseUrl}/polls/${poll.id}`;
      const url = user ? `${pollUrl}?sharedBy=${user.id}` : pollUrl;
      setShareUrl(url);

      // Get dynamic share message if user voted
      if (selectedOption !== null) {
        const messageData = await getShareMessage(poll.id, selectedOption);
        if (messageData?.message) {
          setShareMessage(messageData.message);
        } else {
          setShareMessage(generateDefaultMessage());
        }
      } else {
        setShareMessage(generateDefaultMessage());
      }
    };

    generateShareContent();
  }, [poll, selectedOption, user, getShareMessage]);

  const generateDefaultMessage = () => {
    const hashtags = poll.shareHashtags || 'みんなの投票';
    return `「${poll.title}」に投票しました！\nみんなも投票してみよう！\n\n#${hashtags.replace(/,/g, ' #')}`;
  };

  const copyToClipboard = async () => {
    const fullMessage = `${shareMessage}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareSuccess = async (platform: string) => {
    if (!hasAccess) {
      setIsGrantingAccess(true);
      try {
        await grantAccess(platform);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      } catch (error) {
        console.error('Failed to grant stats access:', error);
      } finally {
        setIsGrantingAccess(false);
      }
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
    handleShareSuccess('twitter');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
    handleShareSuccess('facebook');
  };

  const shareToLine = () => {
    const fullMessage = encodeURIComponent(`${shareMessage}\n${shareUrl}`);
    window.open(
      `https://line.me/R/msg/text/?${fullMessage}`,
      '_blank'
    );
    handleShareSuccess('line');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>投票をシェア</DialogTitle>
          <DialogDescription>
            SNSで投票を共有して、みんなの意見を聞いてみましょう！
            {user && (
              <span className="block mt-1 text-xs">
                あなたのシェアから訪問した人数がカウントされます
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {showSuccessMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              シェアありがとうございます！詳細統計に7日間アクセスできるようになりました
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Share Message */}
          <div>
            <Label htmlFor="message">シェアメッセージ</Label>
            <Textarea
              id="message"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Share URL */}
          <div>
            <Label htmlFor="url">シェアURL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="url"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={shareToTwitter}
              disabled={isGrantingAccess}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={shareToFacebook}
              disabled={isGrantingAccess}
              className="bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              onClick={shareToLine}
              disabled={isGrantingAccess}
              className="bg-[#00C300] hover:bg-[#00a000] text-white"
            >
              <Link2 className="h-4 w-4 mr-2" />
              LINE
            </Button>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} variant="outline" className="w-full">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}