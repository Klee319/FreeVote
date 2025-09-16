'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Twitter, Facebook, Link, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: {
    id: number;
    headword: string;
    reading: string;
    category?: string;
  };
  userVoteResult?: {
    accentType: string;
    prefecture: string;
  };
  accentGraphImage?: string; // アクセントグラフの画像URL
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  word,
  userVoteResult,
  accentGraphImage
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [selectedTab, setSelectedTab] = useState('text');

  // アクセントタイプの日本語名取得
  const getAccentTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'heiban': '平板型',
      'atamadaka': '頭高型',
      'nakadaka': '中高型',
      'odaka': '尾高型'
    };
    return types[type] || type;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/words/${word.id}`);
    }
  }, [word.id]);

  // 共有テキストの生成
  const generateShareText = () => {
    const baseText = `「${word.headword}（${word.reading}）」の発音アクセント投票に参加しました！`;
    
    if (userVoteResult) {
      const accentTypeName = getAccentTypeName(userVoteResult.accentType);
      return `${baseText}\n私の投票: ${accentTypeName}\n\nあなたはどのアクセントで発音しますか？`;
    }
    
    return `${baseText}\n\nあなたはどのアクセントで発音しますか？`;
  };

  // ハッシュタグ生成
  const generateHashtags = () => {
    const tags = ['気になる投票所', '投票', word.headword];
    if (word.category) {
      tags.push(word.category === 'general' ? '一般語' : 
                word.category === 'proper_noun' ? '固有名詞' : 
                word.category === 'technical' ? '専門用語' : '方言');
    }
    return tags;
  };

  // X (Twitter) でシェア
  const shareToX = () => {
    const text = generateShareText();
    const hashtags = generateHashtags().join(',');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(url, '_blank', 'width=550,height=450');
    onClose();
  };

  // Facebook でシェア
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=450');
    onClose();
  };

  // LINE でシェア
  const shareToLine = () => {
    const text = generateShareText();
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=450');
    onClose();
  };

  // リンクをコピー
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('リンクをコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('コピーに失敗しました');
    }
  };

  // 画像をダウンロード
  const downloadImage = () => {
    if (!accentGraphImage) {
      toast.error('画像が準備できていません');
      return;
    }
    
    const link = document.createElement('a');
    link.href = accentGraphImage;
    link.download = `accent-${word.headword}-${Date.now()}.png`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            投票結果をシェア
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">テキストでシェア</TabsTrigger>
              <TabsTrigger value="image">画像でシェア</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-4 space-y-4">
              {/* プレビュー */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{generateShareText()}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {generateHashtags().map((tag) => (
                    <span key={tag} className="text-xs text-blue-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* SNSボタン */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareToX}
                  className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X でシェア
                </Button>
                
                <Button
                  onClick={shareToFacebook}
                  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                
                <Button
                  onClick={shareToLine}
                  className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINE でシェア
                </Button>
                
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      リンクコピー
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="image" className="mt-4 space-y-4">
              {accentGraphImage ? (
                <>
                  {/* 画像プレビュー */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={accentGraphImage}
                      alt="アクセントグラフ"
                      className="w-full rounded"
                    />
                  </div>
                  
                  {/* ダウンロードボタン */}
                  <Button
                    onClick={downloadImage}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    画像をダウンロード
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    ダウンロードした画像をSNSに投稿してシェアできます
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>アクセントグラフ画像を準備中...</p>
                  <p className="text-sm mt-2">テキストでのシェアをご利用ください</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;