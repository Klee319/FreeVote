import { Metadata } from 'next';
import Link from 'next/link';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 日本語アクセント投票サイト',
  description: '日本語アクセント投票サイトのプライバシーポリシーについて説明しています。個人情報の取り扱いについてご確認ください。',
};

export default function PrivacyPage() {
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
            プライバシーポリシー
          </li>
        </ol>
      </nav>

      {/* メインコンテンツ */}
      <article className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">プライバシーポリシー</h1>
        
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
            日本語アクセント投票サイト（以下、「当サイト」といいます。）は、利用者のプライバシーを尊重し、
            個人情報の保護に努めています。本プライバシーポリシーは、当サイトにおける情報の収集、
            利用、管理について説明するものです。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="information-collection" className="text-2xl font-bold text-gray-900 mb-4">
            1. 収集する情報
          </h2>
          <p className="text-gray-700 mb-4">
            当サイトでは、以下の情報を収集します：
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            1.1 利用者が提供する情報
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>年齢層（10代、20代、30代、40代、50代、60代、70代以上）</li>
            <li>性別（男性、女性、その他、回答しない）</li>
            <li>居住都道府県</li>
            <li>アクセント投票データ</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            1.2 自動的に収集される情報
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>IPアドレス（統計処理後に削除）</li>
            <li>ブラウザの種類とバージョン</li>
            <li>オペレーティングシステム</li>
            <li>アクセス日時</li>
            <li>リファラー情報</li>
            <li>Cookieによる識別情報</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="purpose-of-use" className="text-2xl font-bold text-gray-900 mb-4">
            2. 情報の利用目的
          </h2>
          <p className="text-gray-700 mb-4">
            収集した情報は、以下の目的で利用します：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>日本語アクセントパターンの統計分析</li>
            <li>地域別・年代別の言語使用傾向の研究</li>
            <li>サービスの改善と新機能の開発</li>
            <li>不正利用の防止とセキュリティの向上</li>
            <li>匿名化された統計データの公開</li>
            <li>学術研究への貢献（匿名化データのみ）</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="cookie-policy" className="text-2xl font-bold text-gray-900 mb-4">
            3. Cookieの使用について
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            当サイトでは、以下の目的でCookieを使用しています：
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            3.1 必須Cookie
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>
              <strong>セッション管理Cookie：</strong>
              利用者の属性情報を一時的に保存し、投票機能を提供するために使用
            </li>
            <li>
              <strong>セキュリティCookie：</strong>
              CSRF攻撃を防ぐためのトークンを保存
            </li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            3.2 分析Cookie
          </h3>
          <p className="text-gray-700 mb-4">
            サイトの利用状況を分析し、サービスを改善するために使用します。
            これらのCookieは匿名化された情報のみを収集します。
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4" role="note">
            <p className="text-sm text-gray-700">
              <strong>注意：</strong>ブラウザの設定によりCookieを無効にすることができますが、
              その場合、当サイトの一部機能が利用できなくなる可能性があります。
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 id="data-security" className="text-2xl font-bold text-gray-900 mb-4">
            4. データのセキュリティ
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            当サイトは、収集した情報を適切に管理し、以下のセキュリティ対策を実施しています：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>SSL/TLS暗号化通信の使用</li>
            <li>データベースへの不正アクセス防止</li>
            <li>定期的なセキュリティ監査の実施</li>
            <li>アクセスログの監視と異常検知</li>
            <li>個人を特定できる情報の最小化</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="data-retention" className="text-2xl font-bold text-gray-900 mb-4">
            5. データの保存期間
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>投票データ：</strong>
              研究目的のため無期限で保存（ただし、匿名化された形式）
            </li>
            <li>
              <strong>Cookieデータ：</strong>
              最後のアクセスから30日間
            </li>
            <li>
              <strong>アクセスログ：</strong>
              90日間（その後、統計データのみを保持）
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="third-party-sharing" className="text-2xl font-bold text-gray-900 mb-4">
            6. 第三者への情報提供
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            当サイトは、以下の場合を除き、利用者の情報を第三者に提供することはありません：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>利用者の同意がある場合</li>
            <li>法令に基づく開示請求がある場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
            <li>匿名化された統計データとして研究機関に提供する場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="user-rights" className="text-2xl font-bold text-gray-900 mb-4">
            7. 利用者の権利
          </h2>
          <p className="text-gray-700 mb-4">
            利用者は、以下の権利を有します：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>収集された情報の開示を求める権利</li>
            <li>情報の訂正を求める権利</li>
            <li>情報の削除を求める権利（ただし、匿名化されたデータは除く）</li>
            <li>情報の利用停止を求める権利</li>
          </ul>
          <p className="text-gray-700 mt-4">
            これらの権利を行使する場合は、
            <Link href="/contact" className="text-primary-600 hover:underline">
              お問い合わせフォーム
            </Link>
            よりご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="children-privacy" className="text-2xl font-bold text-gray-900 mb-4">
            8. 未成年者の利用について
          </h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトは、13歳未満の児童から意図的に個人情報を収集することはありません。
            13歳以上18歳未満の未成年者が当サイトを利用する場合は、
            保護者の同意を得ることを推奨します。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="international-users" className="text-2xl font-bold text-gray-900 mb-4">
            9. 国外からのアクセスについて
          </h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトは日本国内からのアクセスを想定していますが、
            国外からアクセスされる場合も本プライバシーポリシーが適用されます。
            収集されたデータは日本国内のサーバーで管理されます。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="policy-changes" className="text-2xl font-bold text-gray-900 mb-4">
            10. プライバシーポリシーの変更
          </h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトは、法令の変更やサービスの変更に応じて、
            本プライバシーポリシーを変更することがあります。
            重要な変更がある場合は、サイト上でお知らせします。
          </p>
        </section>

        <section className="mb-8">
          <h2 id="contact-info" className="text-2xl font-bold text-gray-900 mb-4">
            11. お問い合わせ
          </h2>
          <p className="text-gray-700 leading-relaxed">
            本プライバシーポリシーに関するご質問やご意見は、
            <Link href="/contact" className="text-primary-600 hover:underline">
              お問い合わせフォーム
            </Link>
            よりご連絡ください。
          </p>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">運営者情報</h3>
            <p className="text-gray-700">
              日本語アクセント投票サイト運営チーム<br />
              メール: privacy@accent-vote.jp（例）
            </p>
          </div>
        </section>

        {/* ページトップへ戻るボタン - アクセシビリティ対応 */}
        <ScrollToTopButton />
      </article>
    </main>
  );
}