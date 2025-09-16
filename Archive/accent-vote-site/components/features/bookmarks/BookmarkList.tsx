'use client';

import { useBookmarks } from '@/hooks/useBookmarks';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export function BookmarkList() {
  const { bookmarks, removeBookmark, clearBookmarks, isLoading } = useBookmarks();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <BookmarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ブックマークがありません
        </h3>
        <p className="text-gray-500">
          単語の詳細ページでブックマークアイコンをクリックして保存できます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          ブックマーク ({bookmarks.length}件)
        </h2>
        {bookmarks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('すべてのブックマークを削除しますか？')) {
                clearBookmarks();
              }
            }}
            className="text-red-600 hover:text-red-700"
          >
            すべて削除
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.wordId}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Link
                  href={`/words/${bookmark.wordId}`}
                  className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {bookmark.headword}
                  <span className="ml-2 text-sm text-gray-500">
                    （{bookmark.reading}）
                  </span>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(bookmark.bookmarkedAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`「${bookmark.headword}」をブックマークから削除しますか？`)) {
                    removeBookmark(bookmark.wordId);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="ブックマークから削除"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Alert className="mt-6">
        <AlertDescription>
          ブックマークはお使いのブラウザに保存されます。
          ブラウザのデータを削除するとブックマークも削除されますのでご注意ください。
        </AlertDescription>
      </Alert>
    </div>
  );
}