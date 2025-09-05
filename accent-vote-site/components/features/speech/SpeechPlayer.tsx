'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { AccentType } from '@/types';

interface SpeechPlayerProps {
  word: string;
  reading: string;
  accentType: AccentType;
  pattern?: number[];
  dropPosition?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SpeechPlayer({
  word,
  reading,
  accentType,
  pattern,
  dropPosition,
  disabled = false,
  size = 'md',
  className = '',
}: SpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Web Speech APIのサポートチェック
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    // 音声リストの取得
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const jaVoices = availableVoices.filter(voice => voice.lang.startsWith('ja'));
      setVoices(jaVoices.length > 0 ? jaVoices : availableVoices);
    };

    loadVoices();
    
    // 一部のブラウザではvoiceschangedイベントが必要
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      // クリーンアップ
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const getAccentParameters = (type: AccentType) => {
    // NHK式音高表記に基づくパラメータ調整
    switch (type) {
      case 'atamadaka': // 頭高型: 最初が高く、以降下がる
        return {
          pitch: 1.3,     // 高めのピッチ
          rate: 0.9,      // ややゆっくり
          volume: 1.0,
          emphasis: 'start'
        };
      
      case 'heiban': // 平板型: 平坦な音調
        return {
          pitch: 1.0,     // 標準ピッチ
          rate: 1.0,      // 標準速度
          volume: 1.0,
          emphasis: 'none'
        };
      
      case 'nakadaka': // 中高型: 中間部が高い
        return {
          pitch: 1.1,     // やや高めのピッチ
          rate: 0.95,     // わずかにゆっくり
          volume: 1.0,
          emphasis: 'middle'
        };
      
      case 'odaka': // 尾高型: 最後が高い
        return {
          pitch: 0.9,     // 初めは低め
          rate: 1.0,      // 標準速度
          volume: 1.0,
          emphasis: 'end'
        };
      
      default:
        return {
          pitch: 1.0,
          rate: 1.0,
          volume: 1.0,
          emphasis: 'none'
        };
    }
  };

  const playAccentVoice = useCallback(() => {
    if (!isSupported || isPlaying || disabled) return;

    // 既存の再生を停止
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    setIsPlaying(true);

    // 読み仮名を使用（読み仮名がない場合は単語そのもの）
    const textToSpeak = reading || word;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // アクセント型に応じたパラメータを設定
    const params = getAccentParameters(accentType);
    utterance.pitch = params.pitch;
    utterance.rate = params.rate;
    utterance.volume = params.volume;

    // 日本語の音声を優先的に選択
    if (voices.length > 0) {
      const jaVoice = voices.find(v => v.lang === 'ja-JP') || voices[0];
      utterance.voice = jaVoice;
    }

    // 言語設定
    utterance.lang = 'ja-JP';

    // イベントリスナーの設定
    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    // 音声再生
    speechSynthesis.speak(utterance);
  }, [word, reading, accentType, voices, isSupported, isPlaying, disabled]);

  const stopSpeech = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  if (!isSupported) {
    return null; // Web Speech APIがサポートされていない場合は何も表示しない
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <Button
      onClick={isPlaying ? stopSpeech : playAccentVoice}
      disabled={disabled}
      size={buttonSize}
      variant={isPlaying ? 'destructive' : 'outline'}
      className={`gap-2 ${className}`}
      title={isPlaying ? '停止' : `${getAccentTypeName(accentType)}で再生`}
    >
      {isPlaying ? (
        <>
          <VolumeX size={iconSize} />
          <span className={size === 'sm' ? 'sr-only' : ''}>停止</span>
        </>
      ) : (
        <>
          <Volume2 size={iconSize} />
          <span className={size === 'sm' ? 'sr-only' : ''}>再生</span>
        </>
      )}
    </Button>
  );
}

// アクセント型の日本語名を取得
function getAccentTypeName(type: AccentType): string {
  const names: Record<AccentType, string> = {
    atamadaka: '頭高型',
    heiban: '平板型',
    nakadaka: '中高型',
    odaka: '尾高型',
  };
  return names[type] || type;
}