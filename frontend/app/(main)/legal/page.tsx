'use client';

import React, { useState } from 'react';

type Section = 'terms' | 'privacy' | 'disclaimer';

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState<Section>('terms');

  const sections = [
    { id: 'terms' as Section, title: '利用規約', icon: '📜' },
    { id: 'privacy' as Section, title: 'プライバシーポリシー', icon: '🔐' },
    { id: 'disclaimer' as Section, title: '免責事項', icon: '⚠️' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'terms':
        return (
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold mb-6">利用規約</h2>
            <p className="text-sm text-gray-500 mb-6">最終更新日：2025年1月16日</p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第1条（本規約の適用）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                本規約は、みんなの投票プラットフォーム（以下「当サービス」）の利用条件を定めるものです。
                ユーザーの皆様には、本規約に従って当サービスをご利用いただきます。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第2条（利用登録）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                1. 当サービスの一部機能の利用には、利用登録が必要となります。<br />
                2. 登録希望者は、当社の定める方法により、正確な情報を提供して登録申請を行うものとします。<br />
                3. 虚偽の情報を登録した場合、サービスの利用を制限することがあります。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第3条（ユーザーIDおよびパスワードの管理）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                1. ユーザーは、自己の責任において、ユーザーIDおよびパスワードを適切に管理するものとします。<br />
                2. ユーザーIDおよびパスワードの管理不十分による損害の責任はユーザーが負うものとします。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第4条（禁止事項）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません：<br />
                • 法令または公序良俗に違反する行為<br />
                • 他のユーザーまたは第三者の権利を侵害する行為<br />
                • 当サービスの運営を妨害する行為<br />
                • 不正アクセスまたはこれを試みる行為<br />
                • 当社が不適切と判断する行為
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第5条（本サービスの提供の停止等）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、以下のいずれかの事由があると判断した場合、事前の通知なく本サービスの提供を停止または中断できるものとします：<br />
                • 保守点検または更新を行う場合<br />
                • 地震、落雷、火災、停電または天災などの不可抗力により提供が困難な場合<br />
                • その他、当社が停止または中断を必要と判断した場合
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">第6条（免責事項）</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
              </p>
            </section>
          </div>
        );

      case 'privacy':
        return (
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold mb-6">プライバシーポリシー</h2>
            <p className="text-sm text-gray-500 mb-6">最終更新日：2025年1月16日</p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">1. 個人情報の収集</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスでは、サービス提供のため以下の個人情報を収集することがあります：<br />
                • メールアドレス<br />
                • IPアドレス<br />
                • Cookie情報<br />
                • その他当サービスの利用状況に関する情報
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">2. 個人情報の利用目的</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                収集した個人情報は、以下の目的で利用いたします：<br />
                • サービスの提供・運営のため<br />
                • ユーザーからのお問い合わせに対応するため<br />
                • サービスの改善・新サービスの開発のため<br />
                • 利用規約に違反したユーザーへの対応のため<br />
                • その他上記利用目的に付随する目的
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">3. 個人情報の第三者提供</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません：<br />
                • 法令に基づく場合<br />
                • 人の生命、身体または財産の保護のために必要がある場合<br />
                • 公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合<br />
                • 国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">4. 個人情報の安全管理</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、個人情報の漏洩、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">5. Cookieの使用</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスでは、ユーザー体験の向上のためCookieを使用しています。
                ブラウザの設定によりCookieを無効にすることも可能ですが、その場合一部のサービスがご利用いただけなくなることがあります。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">6. お問い合わせ</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                本ポリシーに関するお問い合わせは、サイト内のお問い合わせフォームからお願いいたします。
              </p>
            </section>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold mb-6">免責事項</h2>
            <p className="text-sm text-gray-500 mb-6">最終更新日：2025年1月16日</p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">1. サービスの内容について</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスで提供される投票結果および情報は、参考情報として提供されるものであり、
                その正確性、完全性、有用性について保証するものではありません。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">2. 投票結果の利用について</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスの投票結果を利用して行う一切の行為について、当社は責任を負いません。
                投票結果の利用は、ユーザー自身の判断と責任において行ってください。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">3. 外部リンクについて</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスから他のウェブサイトへのリンクまたは他のウェブサイトから当サービスへのリンクが提供されている場合でも、
                当社は、当サービス以外のウェブサイトおよびそこから得られる情報に関して責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">4. サービスの中断・停止について</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、以下の場合にサービスの全部または一部の提供を中断・停止することがあります：<br />
                • サーバー、通信回線等の障害、停電、天災等の不可抗力により、サービスの提供が困難な場合<br />
                • システムの保守・点検を行う場合<br />
                • その他、運営上または技術上の理由でやむを得ない場合<br /><br />
                これらによってユーザーに生じた損害について、当社は一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">5. 損害賠償の制限</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当サービスの利用により発生したユーザーの損害については、当社に故意または重過失がある場合を除き、
                当社は一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold mb-4">6. 免責事項の変更</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本免責事項を変更できるものとします。
                変更後の免責事項は、当サービス上に掲載した時点から効力を生じるものとします。
              </p>
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
            法的情報
          </h1>
          <p className="text-sm md:text-base text-gray-600 px-2">
            みんなの投票プラットフォームの利用に関する重要な法的情報です
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* タブナビゲーション */}
          <div className="flex flex-col sm:flex-row border-b border-gray-200">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex-1 px-4 md:px-6 py-3 md:py-4 text-center font-medium transition-all duration-200
                  ${activeSection === section.id
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
                `}
              >
                <span className="text-lg md:text-xl mr-1 md:mr-2">{section.icon}</span>
                <span className="text-sm md:text-base">{section.title}</span>
              </button>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div className="p-4 md:p-8 max-h-[500px] md:max-h-[600px] overflow-y-auto">
            {renderContent()}
          </div>
        </div>

        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-500 px-2">
          <p>
            これらの法的文書は定期的に更新される場合があります。<br />
            最新の内容を確認するには、定期的にこのページをご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}