import { BookmarkList } from '@/components/features/bookmarks/BookmarkList';

export const metadata = {
  title: 'ブックマーク | アクセント投票サイト',
  description: 'ブックマークした単語の一覧',
};

export default function BookmarksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ブックマーク
        </h1>
        <BookmarkList />
      </div>
    </div>
  );
}