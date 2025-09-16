import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "みんなの投票 - 誰でも簡単に参加できる投票プラットフォーム",
  description: "みんなの投票は、誰でも簡単に投票に参加でき、SNSで拡散しやすいプラットフォームです。アクセント投票から時事ネタまで、様々なテーマの投票に参加しましょう。",
  keywords: "投票,アンケート,アクセント,方言,SNS,シェア,ランキング",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://minna-no-touhyou.jp",
    siteName: "みんなの投票",
    title: "みんなの投票",
    description: "誰でも簡単に参加できる投票プラットフォーム",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "みんなの投票",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@minna_touhyou",
    creator: "@minna_touhyou",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
