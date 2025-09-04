import { Metadata } from 'next';
import AccentMapContainer from '@/components/features/map/AccentMapContainer';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { MapPin, BarChart3, Info } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: '日本のアクセント分布地図 | アクセント投票サイト',
  description: '日本全国のアクセント分布を可視化した地図。都道府県ごとのアクセントタイプの傾向を一目で確認できます。',
  keywords: '日本語, アクセント, 方言, 地図, 都道府県, 頭高型, 平板型, 中高型, 尾高型',
  openGraph: {
    title: '日本のアクセント分布地図',
    description: '日本全国のアクセント分布を可視化',
    type: 'website',
  },
};

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* パンくずリスト */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/map">アクセント分布地図</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ページタイトル */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          日本のアクセント分布地図
        </h1>
        <p className="text-muted-foreground">
          日本全国の都道府県別アクセント傾向を視覚的に確認できます。
          各地域で最も多く投票されたアクセントタイプを色分けして表示しています。
        </p>
      </div>

      {/* 情報アラート */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>地図の見方</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• 各都道府県の色は、その地域で最も投票数が多いアクセントタイプを表しています</li>
            <li>• 都道府県にマウスを合わせると詳細な投票統計が表示されます</li>
            <li>• 都道府県をクリックすると、より詳しい統計ページへ移動します</li>
            <li>• 右側のコントロールパネルで表示設定を調整できます</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* 地図コンテナ */}
      <div className="mb-8">
        <AccentMapContainer />
      </div>

      {/* 関連リンク */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Link href="/statistics" className="block">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">詳細統計</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              全国および都道府県別の詳細な投票統計データを確認できます
            </p>
          </div>
        </Link>

        <Link href="/vote" className="block">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">投票に参加</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              あなたの地域のアクセントを投票して、地図データに貢献しましょう
            </p>
          </div>
        </Link>
      </div>

      {/* データについての注意事項 */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">データについて</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• この地図は投票データに基づいており、学術的な調査結果ではありません</li>
          <li>• 投票数が少ない地域では、実際の傾向と異なる可能性があります</li>
          <li>• データは随時更新されており、表示内容は変動する可能性があります</li>
        </ul>
      </div>
    </div>
  );
}