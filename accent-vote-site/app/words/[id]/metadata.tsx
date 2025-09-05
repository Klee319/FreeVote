import { Metadata } from 'next';
import { api } from '@/lib/api';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const wordDetail = await api.getWordDetail(params.id);
    
    const title = `「${wordDetail.headword}」のアクセント投票 | 日本語アクセント投票サイト`;
    const description = `「${wordDetail.headword}（${wordDetail.reading}）」の発音アクセントに投票しよう！全国の方言・アクセントの違いを可視化する参加型の言語調査プロジェクトです。`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/words/${params.id}`,
        siteName: '日本語アクセント投票サイト',
        images: [
          {
            url: `/api/og/words/${params.id}`, // OG画像生成APIエンドポイント
            width: 1200,
            height: 630,
            alt: `${wordDetail.headword}のアクセント分布`,
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og/words/${params.id}`],
        creator: '@accent_vote', // 実際のTwitterハンドルに変更
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/words/${params.id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '日本語アクセント投票サイト',
      description: '全国の方言・アクセントの違いを可視化する参加型の言語調査プロジェクト',
    };
  }
}