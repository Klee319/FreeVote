'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BookmarkItem {
  wordId: number;
  headword: string;
  reading: string;
  bookmarkedAt: string;
}

const BOOKMARKS_KEY = 'accent-vote-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage から初期データ読み込み
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BookmarkItem[];
        setBookmarks(parsed);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // localStorage に保存
  const saveBookmarks = useCallback((items: BookmarkItem[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
      setBookmarks(items);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  // ブックマーク追加
  const addBookmark = useCallback((wordId: number, headword: string, reading: string) => {
    const newBookmark: BookmarkItem = {
      wordId,
      headword,
      reading,
      bookmarkedAt: new Date().toISOString()
    };
    
    const updated = [...bookmarks, newBookmark];
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  // ブックマーク削除
  const removeBookmark = useCallback((wordId: number) => {
    const updated = bookmarks.filter(b => b.wordId !== wordId);
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  // ブックマーク切り替え
  const toggleBookmark = useCallback((wordId: number, headword: string, reading: string) => {
    const isBookmarked = bookmarks.some(b => b.wordId === wordId);
    
    if (isBookmarked) {
      removeBookmark(wordId);
    } else {
      addBookmark(wordId, headword, reading);
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  // 特定の単語がブックマークされているか確認
  const isBookmarked = useCallback((wordId: number) => {
    return bookmarks.some(b => b.wordId === wordId);
  }, [bookmarks]);

  // すべてクリア
  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks
  };
}