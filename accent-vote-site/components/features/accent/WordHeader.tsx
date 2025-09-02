'use client';

import { useState, useEffect, useCallback } from 'react';
import { WordDetail } from '@/types';
import { SpeakerWaveIcon, BookmarkIcon, FlagIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, SpeakerWaveIcon as SpeakerWaveSolidIcon } from '@heroicons/react/24/solid';
import { useBookmarks } from '@/hooks/useBookmarks';
import { ReportDialog, ReportReason } from './ReportDialog';

interface WordHeaderProps {
  word: WordDetail;
}

export function WordHeader({ word }: WordHeaderProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Web Speech API のサポート確認
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  // 音声発話機能
  const handlePlayAudio = useCallback(() => {
    if (!speechSupported || isSpeaking) return;

    // 既存の発話をキャンセル
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word.reading);
    
    // 日本語の音声を選択
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => 
      voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
    );
    
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }
    
    // 発話速度とピッチの調整
    utterance.rate = 0.9; // 少しゆっくり
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // イベントハンドラ
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    // 発話開始
    window.speechSynthesis.speak(utterance);
  }, [word.reading, speechSupported, isSpeaking]);

  // 音声リストの読み込み（初回）
  useEffect(() => {
    if (speechSupported) {
      // 音声リストが空の場合があるため、voiceschangedイベントを待つ
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    }
  }, [speechSupported]);

  // コンポーネントのアンマウント時に発話を停止
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ブックマーク切り替え
  const handleBookmark = useCallback(() => {
    toggleBookmark(word.id, word.headword, word.reading);
  }, [word.id, word.headword, word.reading, toggleBookmark]);

  // 報告機能
  const handleReport = useCallback(async (reason: ReportReason, details: string) => {
    // APIエンドポイントに報告を送信
    const response = await fetch('/api/words/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wordId: word.id,
        reason,
        details,
        // デバイスIDなどの追加情報が必要な場合はここに追加
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '報告の送信に失敗しました');
    }

    return response.json();
  }, [word.id]);

  const bookmarked = isBookmarked(word.id);

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {word.headword}
              <span className="ml-3 text-xl text-gray-600">（{word.reading}）</span>
            </h1>
            
            {word.aliases && word.aliases.length > 0 && (
              <div className="text-sm text-gray-500 mb-3">
                別表記: {word.aliases.join('、')}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                モーラ数: {word.moraCount}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {word.category === 'general' ? '一般語' :
                 word.category === 'proper_noun' ? '固有名詞' :
                 word.category === 'technical' ? '専門用語' : '方言'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePlayAudio}
              className={`p-2 rounded-lg transition-all ${
                isSpeaking 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={speechSupported ? (isSpeaking ? '再生中...' : '音声を再生') : '音声再生は利用できません'}
              disabled={!speechSupported}
            >
              {isSpeaking ? (
                <SpeakerWaveSolidIcon className="w-5 h-5 animate-pulse" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-all ${
                bookmarked 
                  ? 'bg-yellow-100 text-yellow-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={bookmarked ? 'ブックマークを解除' : 'ブックマーク'}
            >
              {bookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5" />
              ) : (
                <BookmarkIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setReportDialogOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="問題を報告"
            >
              <FlagIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* モーラ分割表示 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">モーラ分割:</div>
          <div className="flex items-center space-x-2">
            {word.moraSegments.map((mora, index) => (
              <span key={index} className="text-lg font-medium">
                {mora}
                {index < word.moraSegments.length - 1 && (
                  <span className="text-gray-400 mx-1">・</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 報告ダイアログ */}
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        wordId={word.id}
        headword={word.headword}
        onReport={handleReport}
      />
    </>
  );
}