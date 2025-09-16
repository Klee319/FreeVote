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
import { Poll } from '@/types';
import { usePolls } from '@/hooks/usePolls';
import { useAuthStore } from '@/stores/authStore';
import { Copy, Twitter, Facebook, Link2 } from 'lucide-react';

interface ShareDialogProps {
  poll: Poll;
  selectedOption: number | null;
  onClose: () => void;
}

export function ShareDialog({ poll, selectedOption, onClose }: ShareDialogProps) {
  const { getShareMessage } = usePolls();
  const { user } = useAuthStore();
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

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

  const shareToTwitter = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
  };

  const shareToLine = () => {
    const fullMessage = encodeURIComponent(`${shareMessage}\n${shareUrl}`);
    window.open(
      `https://line.me/R/msg/text/?${fullMessage}`,
      '_blank'
    );
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
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={shareToFacebook}
              className="bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              onClick={shareToLine}
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