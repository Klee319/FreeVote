# Script要素エラーの修正報告書

## 不具合・エラーの概要
日時：2025年9月3日
報告者からの症状：
1. loading chunk app/layout failed (timeout: http://localhost:3000/_next/static/chunks/app/layout.js)
2. app/layout.tsx (94:9) @ RootLayout - Script要素でエラー
3. Application error: a client-side exception has occurred

## 考察した原因

### STEP1で特定した問題箇所
app/layout.tsx の94行目：
```tsx
<head>
  {/* Structured Data */}
  <Script
    id="structured-data"
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(structuredData),
    }}
  />
</head>
```

### STEP2での原因分析
1. **Next.js App Routerでの不適切なScript配置**
   - App RouterではHTML要素の`<head>`タグ内に`Script`コンポーネントを配置してはいけない
   - Next.jsのScriptコンポーネントは自動的に最適な位置に配置される

2. **構造化データの実装方法の誤り**
   - JSON-LDの構造化データを`Script`コンポーネントで実装しているが、App Routerでは異なる方法が推奨される

## 実際に修正した原因
Next.js App RouterでのScriptコンポーネントの不適切な使用

## 修正内容と修正箇所

### 修正方針（STEP3）
1. **Scriptコンポーネントの配置変更**
   - `<head>`タグ内からScriptコンポーネントを削除
   - `<body>`内に移動し、`strategy="beforeInteractive"`を指定

2. **構造化データの実装方法変更**
   - 方法1：Scriptコンポーネントをbody内に配置
   - 方法2：通常の`<script>`タグを使用（dangerouslySetInnerHTMLを使用）

### 推奨される修正内容

#### 方法1：Scriptコンポーネントをbody内に配置
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} font-japanese`}>
        {/* Script要素をbody内に移動 */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツへスキップ
        </a>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
```

#### 方法2：通常のscriptタグを使用
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* 構造化データを通常のscriptタグで実装 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} font-japanese`}>
        {/* 以下同じ */}
      </body>
    </html>
  );
}
```

## 追加の改善点
1. **next.config.jsの警告対応**
   - 不要なオプション（turbotrace, telemetry）の削除を推奨

2. **preconnectリンクの配置**
   - headタグを使用する場合は、metadataオブジェクトに統合することを検討

## 結論
Next.js 15のApp Routerでは、Scriptコンポーネントをheadタグ内に配置できません。構造化データは、Scriptコンポーネントをbody内で使用するか、通常のscriptタグを使用する必要があります。