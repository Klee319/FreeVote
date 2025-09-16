import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';

export const metadata: Metadata = {
  title: '使い方ガイド | 気になる投票所',
  description: '気になる投票所の使い方を分かりやすく説明します。初めての方でも簡単に投票できます。',
};

export default function GuidePage() {
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
            使い方ガイド
          </li>
        </ol>
      </nav>

      {/* メインコンテンツ */}
      <article className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">使い方ガイド</h1>
        
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8" role="note">
          <p className="text-gray-700">
            このガイドでは、気になる投票所の基本的な使い方を説明します。
            初めての方でも簡単に参加できます！
          </p>
        </div>

        {/* 目次 */}
        <section className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">目次</h2>
          <nav aria-label="ページ内ナビゲーション">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <a href="#getting-started" className="text-primary-600 hover:underline">
                  はじめに - サイトへの登録
                </a>
              </li>
              <li>
                <a href="#voting" className="text-primary-600 hover:underline">
                  アクセント投票の方法
                </a>
              </li>
              <li>
                <a href="#search" className="text-primary-600 hover:underline">
                  単語を検索する
                </a>
              </li>
              <li>
                <a href="#statistics" className="text-primary-600 hover:underline">
                  統計データを見る
                </a>
              </li>
              <li>
                <a href="#ranking" className="text-primary-600 hover:underline">
                  ランキングを確認する
                </a>
              </li>
              <li>
                <a href="#submit-word" className="text-primary-600 hover:underline">
                  新しい単語を提案する
                </a>
              </li>
              <li>
                <a href="#faq" className="text-primary-600 hover:underline">
                  よくある質問
                </a>
              </li>
            </ol>
          </nav>
        </section>

        {/* ステップ1: はじめに */}
        <section id="getting-started" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              1
            </span>
            はじめに - サイトへの登録
          </h2>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">初回アクセス時の設定</h3>
            <p className="text-gray-700 mb-4">
              初めてサイトにアクセスすると、簡単な属性情報の入力画面が表示されます。
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>年齢層を選択：</strong>
                10代、20代、30代、40代、50代、60代、70代以上から選択
              </li>
              <li>
                <strong>性別を選択：</strong>
                男性、女性、その他、回答しないから選択
              </li>
              <li>
                <strong>お住まいの都道府県を選択：</strong>
                47都道府県から選択
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4" role="note">
            <p className="text-sm text-gray-700">
              <strong>プライバシーについて：</strong>
              入力された情報は統計分析にのみ使用され、個人を特定することはありません。
              詳しくは
              <Link href="/privacy" className="text-primary-600 hover:underline">
                プライバシーポリシー
              </Link>
              をご確認ください。
            </p>
          </div>
        </section>

        {/* ステップ2: 投票方法 */}
        <section id="voting" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              2
            </span>
            アクセント投票の方法
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">投票の手順</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  <strong>単語を選択：</strong>
                  トップページの「注目の単語」や検索機能から投票したい単語を選びます
                </li>
                <li>
                  <strong>アクセントパターンを確認：</strong>
                  表示された4つのアクセントパターン（頭高型、平板型、中高型、尾高型）を確認します
                </li>
                <li>
                  <strong>自分の発音に近いものを選択：</strong>
                  普段自分が使っている発音に最も近いパターンをクリックして投票します
                </li>
                <li>
                  <strong>結果を確認：</strong>
                  投票後、現在の統計結果が表示されます
                </li>
              </ol>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">アクセント型の説明</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="font-medium text-gray-900">頭高型（あたまだか）</dt>
                  <dd className="text-gray-700 ml-4">
                    最初の音が高く、それ以降が低くなるパターン
                    <span className="text-sm text-gray-600 block">例：「はし」（箸）</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">平板型（へいばん）</dt>
                  <dd className="text-gray-700 ml-4">
                    全体的に平坦な音の高さで発音するパターン
                    <span className="text-sm text-gray-600 block">例：「さくら」（桜）</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">中高型（なかだか）</dt>
                  <dd className="text-gray-700 ml-4">
                    単語の中間部分が高くなるパターン
                    <span className="text-sm text-gray-600 block">例：「たまご」（卵）</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">尾高型（おだか）</dt>
                  <dd className="text-gray-700 ml-4">
                    最後の音が高くなるパターン
                    <span className="text-sm text-gray-600 block">例：「あめ」（雨）</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* ステップ3: 検索 */}
        <section id="search" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              3
            </span>
            単語を検索する
          </h2>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">検索機能の使い方</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>キーワード検索：</strong>
                ページ上部の検索ボックスに単語を入力します
              </li>
              <li>
                <strong>ひらがな・カタカナ・漢字対応：</strong>
                どの表記でも検索可能です
              </li>
              <li>
                <strong>部分一致検索：</strong>
                単語の一部を入力しても候補が表示されます
              </li>
              <li>
                <strong>カテゴリー絞り込み：</strong>
                日常会話、専門用語などのカテゴリーで絞り込むことができます
              </li>
            </ul>
          </div>
        </section>

        {/* ステップ4: 統計 */}
        <section id="statistics" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              4
            </span>
            統計データを見る
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">確認できる統計情報</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>全体の投票結果：</strong>
                  各アクセントパターンの投票割合
                </li>
                <li>
                  <strong>地域別の傾向：</strong>
                  都道府県ごとのアクセント分布
                </li>
                <li>
                  <strong>年代別の傾向：</strong>
                  世代による発音の違い
                </li>
                <li>
                  <strong>性別による違い：</strong>
                  性別ごとの傾向分析
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">地図表示機能</h3>
              <p className="text-gray-700">
                日本地図上で、各地域のアクセント傾向を色分けして表示します。
                視覚的に地域差を確認することができます。
              </p>
            </div>
          </div>
        </section>

        {/* ステップ5: ランキング */}
        <section id="ranking" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              5
            </span>
            ランキングを確認する
          </h2>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">ランキングページの機能</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>人気の単語：</strong>
                投票数が多い単語のランキング
              </li>
              <li>
                <strong>地域別ランキング：</strong>
                都道府県ごとの注目単語
              </li>
              <li>
                <strong>期間別表示：</strong>
                週間、月間、全期間でのランキング切り替え
              </li>
              <li>
                <strong>アクセント型別：</strong>
                特定のアクセント型が多い単語の一覧
              </li>
            </ul>
          </div>
        </section>

        {/* ステップ6: 単語提案 */}
        <section id="submit-word" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
              6
            </span>
            新しい単語を提案する
          </h2>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">単語の提案方法</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>ヘッダーメニューの「単語を提案」をクリック</li>
              <li>提案したい単語と読み方を入力</li>
              <li>カテゴリーを選択（日常会話、専門用語など）</li>
              <li>送信ボタンをクリック</li>
            </ol>
            <p className="text-gray-700 mt-4">
              提案された単語は管理者による確認後、投票対象として追加されます。
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            よくある質問
          </h2>

          <div className="space-y-4">
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                投票は何回でもできますか？
              </summary>
              <p className="mt-3 text-gray-700">
                同じ単語への投票は1回のみです。ただし、別の単語には何度でも投票できます。
              </p>
            </details>

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                自分の投票を変更できますか？
              </summary>
              <p className="mt-3 text-gray-700">
                一度投票した内容は変更できません。慎重に選んで投票してください。
              </p>
            </details>

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                登録した属性情報は変更できますか？
              </summary>
              <p className="mt-3 text-gray-700">
                セキュリティと統計の正確性のため、一度登録した属性情報は変更できません。
              </p>
            </details>

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                どのアクセント型か分からない時は？
              </summary>
              <p className="mt-3 text-gray-700">
                各アクセント型には音声サンプルと図解が用意されています。
                それでも分からない場合は、「分からない」オプションを選択することもできます。
              </p>
            </details>

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                データはどのように使われますか？
              </summary>
              <p className="mt-3 text-gray-700">
                収集されたデータは匿名化され、日本語研究や教育目的で使用されます。
                詳細は
                <Link href="/privacy" className="text-primary-600 hover:underline">
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </details>
          </div>
        </section>

        {/* お問い合わせ */}
        <section className="mb-8 p-6 bg-primary-50 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            さらにサポートが必要ですか？
          </h2>
          <p className="text-gray-700 mb-4">
            ご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            お問い合わせフォームへ
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </section>

        {/* ページトップへ戻るボタン - アクセシビリティ対応 */}
        <ScrollToTopButton />
      </article>
    </main>
  );
}