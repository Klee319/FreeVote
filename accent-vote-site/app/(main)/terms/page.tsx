import { Metadata } from 'next';
import Link from 'next/link';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';

export const metadata: Metadata = {
  title: '利用規約 | 気になる投票所',
  description: '気になる投票所の利用規約について説明しています。',
};

export default function TermsPage() {
  const lastUpdated = '2025年8月29日';

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ブレッドクラム - アクセシビリティ対応 */}
      <nav aria-label="パンくずリスト" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/" className="hover:text-primary-600 transition-colors">
              ホーム
            </Link>
          </li>
          <li>
            <span className="mx-2" aria-hidden="true">/</span>
          </li>
          <li aria-current="page" className="text-gray-900 font-medium">
            利用規約
          </li>
        </ol>
      </nav>

      {/* メインコンテンツ */}
      <article className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">利用規約</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8" role="note">
          <p className="text-sm text-gray-700">
            最終更新日: {lastUpdated}
          </p>
        </div>

        <section className="mb-8">
          <h2 id="introduction" className="text-2xl font-bold text-gray-900 mb-4">
            はじめに
          </h2>
          <p className="text-gray-700 leading-relaxed">
            この利用規約（以下、「本規約」といいます。）は、気になる投票所（以下、「当サイト」といいます。）の利用条件を定めるものです。
            当サイトをご利用いただく場合は、本規約に同意したものとみなします。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="service-description" className="text-2xl font-bold text-gray-900 mb-4">
            第1条 サービスの内容
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            当サイトは、日本語のアクセントパターンに関する情報を収集・共有するプラットフォームを提供します。
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>日本語単語のアクセントパターンの投票機能</li>
            <li>地域別・年代別のアクセント傾向の表示</li>
            <li>統計データの閲覧機能</li>
            <li>教育・研究目的でのデータ利用</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="user-registration" className="text-2xl font-bold text-gray-900 mb-4">
            第2条 利用登録
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              当サイトの利用にあたり、利用者は年齢層、性別、居住都道府県の情報を提供するものとします。
            </li>
            <li>
              提供された情報は統計的な分析にのみ使用され、個人を特定する目的では使用しません。
            </li>
            <li>
              虚偽の情報を登録することは禁止します。
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 id="prohibited-activities" className="text-2xl font-bold text-gray-900 mb-4">
            第3条 禁止事項
          </h2>
          <p className="text-gray-700 mb-4">
            利用者は、当サイトの利用にあたり、以下の行為を行ってはなりません。
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>法令または公序良俗に違反する行為</li>
            <li>当サイトのサーバーに過度な負荷をかける行為</li>
            <li>不正アクセスやシステムの脆弱性を探る行為</li>
            <li>他の利用者の利用を妨げる行為</li>
            <li>当サイトの運営を妨害する行為</li>
            <li>不適切または虚偽のデータを意図的に投稿する行為</li>
            <li>自動化ツール（ボット等）を使用した大量投票</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="intellectual-property" className="text-2xl font-bold text-gray-900 mb-4">
            第4条 知的財産権
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              当サイトのコンテンツ、デザイン、ロゴ等の知的財産権は、当サイト運営者に帰属します。
            </li>
            <li>
              収集されたアクセントデータは、教育・研究目的での利用を許可する場合があります。
              詳細は「データ利用について」をご確認ください。
            </li>
            <li>
              利用者が投稿したデータについて、当サイトは統計処理および研究目的での利用権を有します。
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 id="privacy" className="text-2xl font-bold text-gray-900 mb-4">
            第5条 プライバシー
          </h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトは、利用者のプライバシーを尊重し、個人情報の保護に努めます。
            詳細は
            <Link href="/privacy" className="text-primary-600 hover:underline">
              プライバシーポリシー
            </Link>
            をご確認ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="disclaimer" className="text-2xl font-bold text-gray-900 mb-4">
            第6条 免責事項
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              当サイトで提供される情報は、統計的なデータに基づくものであり、
              言語学的な正確性を保証するものではありません。
            </li>
            <li>
              当サイトの利用により生じた損害について、運営者は責任を負いません。
            </li>
            <li>
              当サイトは、予告なくサービスの内容を変更または終了する場合があります。
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 id="service-modification" className="text-2xl font-bold text-gray-900 mb-4">
            第7条 サービスの変更・中断
          </h2>
          <p className="text-gray-700 leading-relaxed">
            運営者は、以下の場合にサービスの全部または一部を変更・中断することがあります。
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
            <li>システムのメンテナンスを行う場合</li>
            <li>天災等の不可抗力により、サービスの提供が困難な場合</li>
            <li>その他、運営上必要と判断した場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="terms-modification" className="text-2xl font-bold text-gray-900 mb-4">
            第8条 利用規約の変更
          </h2>
          <p className="text-gray-700 leading-relaxed">
            運営者は、必要と判断した場合には、利用者への事前通知なく本規約を変更することができます。
            変更後の規約は、当サイトに掲載した時点から効力を生じるものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="governing-law" className="text-2xl font-bold text-gray-900 mb-4">
            第9条 準拠法・管轄裁判所
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li>
              当サイトに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 id="contact" className="text-2xl font-bold text-gray-900 mb-4">
            第10条 お問い合わせ
          </h2>
          <p className="text-gray-700 leading-relaxed">
            本規約に関するお問い合わせは、
            <Link href="/contact" className="text-primary-600 hover:underline">
              お問い合わせフォーム
            </Link>
            よりご連絡ください。
          </p>
        </section>

        {/* ページトップへ戻るボタン - アクセシビリティ対応 */}
        <ScrollToTopButton />
      </article>
    </main>
  );
}