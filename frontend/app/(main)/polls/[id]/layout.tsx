import { Metadata } from 'next';
import { isValidUUID } from '@/lib/validation';
import { logError } from '@/lib/error-logger';

interface PollOption {
  label: string;
  id?: string;
  thumbnailUrl?: string;
  pitchPattern?: number[];
  voiceSampleUrl?: string;
}

interface ShareMetadata {
  title: string;
  description: string;
  options: (string | PollOption)[];
  categories: string[];
  totalVotes: number;
  commentCount: number;
  thumbnailUrl: string | null;
  deadline: string | null;
}

// エラーログのユーティリティ関数（既存のローカル関数は削除し、共通ユーティリティを使用）

// 404専用メタデータ関数
function getNotFoundMetadata(): Metadata {
  return {
    title: '投票が見つかりません - みんなの投票',
    description: 'お探しの投票は削除されたか、存在しません。',
    openGraph: {
      title: '投票が見つかりません',
      description: 'お探しの投票は削除されたか、存在しません。',
      siteName: 'みんなの投票',
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: '投票が見つかりません',
      description: 'お探しの投票は削除されたか、存在しません。',
      creator: '@みんなの投票',
    },
  };
}

// フォールバックメタデータ関数
function getFallbackMetadata(pollUrl: string): Metadata {
  return {
    title: 'みんなの投票',
    description: 'あなたの声を聞かせてください。様々なテーマについて投票して、みんなの意見を見てみよう!',
    openGraph: {
      title: 'みんなの投票',
      description: 'あなたの声を聞かせてください。様々なテーマについて投票して、みんなの意見を見てみよう!',
      url: pollUrl,
      siteName: 'みんなの投票',
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'みんなの投票',
      description: 'あなたの声を聞かせてください。様々なテーマについて投票して、みんなの意見を見てみよう!',
      creator: '@みんなの投票',
    },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    // Next.js 15では params が Promise になったため await が必要
    const { id } = await params;

    // UUID検証（SSRF脆弱性対策）
    if (!isValidUUID(id)) {
      logError('generateMetadata', new Error(`Invalid poll ID format: ${id}`));
      return getNotFoundMetadata();
    }

    // APIからデータ取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/polls/${id}/share-metadata`, {
      next: {
        revalidate: 60,  // 1分ごとに再検証
      },
    });

    // レスポンスステータスの詳細チェック
    if (!response.ok) {
      const status = response.status;

      if (status === 404) {
        logError('generateMetadata', new Error(`Poll not found: ${id}`));
        return getNotFoundMetadata();
      } else if (status >= 500) {
        logError('generateMetadata', new Error(`Server error: ${status}`));
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const pollUrl = `${appUrl}/polls/${id}`;
        return getFallbackMetadata(pollUrl);
      } else {
        logError('generateMetadata', new Error(`API error: ${status}`));
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const pollUrl = `${appUrl}/polls/${id}`;
        return getFallbackMetadata(pollUrl);
      }
    }

    const { data } = await response.json();
    const metadata: ShareMetadata = data;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pollUrl = `${appUrl}/polls/${id}`;

    // 説明文を生成（optionsがstring[]またはPollOption[]に対応）
    const optionsText = metadata.options
      .map(opt => typeof opt === 'string' ? opt : opt.label)
      .slice(0, 3)
      .join('、');
    const description = metadata.description ||
      `${optionsText}${metadata.options.length > 3 ? `...他${metadata.options.length - 3}件` : ''} - ${metadata.totalVotes}人が投票 - ${metadata.commentCount || 0}件のコメント`;

    return {
      title: metadata.title,
      description: description.slice(0, 160), // メタディスクリプションは160文字程度に制限
      openGraph: {
        title: metadata.title,
        description: description.slice(0, 160),
        url: pollUrl,
        siteName: 'みんなの投票',
        images: [
          {
            url: `${appUrl}/polls/${id}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: metadata.title,
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: description.slice(0, 160),
        images: [`${appUrl}/polls/${id}/opengraph-image`],
        creator: '@みんなの投票',
      },
      alternates: {
        canonical: pollUrl,
      },
    };
  } catch (error) {
    logError('generateMetadata', error);

    // Next.js 15では params が Promise になったため await が必要
    const { id } = await params;

    // エラー時のフォールバックメタデータ
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pollUrl = `${appUrl}/polls/${id}`;

    return getFallbackMetadata(pollUrl);
  }
}

export default function PollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
