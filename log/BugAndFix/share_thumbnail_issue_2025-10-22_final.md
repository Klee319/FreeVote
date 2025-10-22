# シェアボタンのサムネイル画像問題 - 最終調査報告

## 調査日時
2025-10-22

## 真の原因

### 1. metadataBase の欠落（最重要）
**問題**: ルートレイアウト (`frontend/app/layout.tsx`) に `metadataBase` プロパティが設定されていない

**影響**:
- Next.js 15 では metadataBase がないと、OGP画像の相対URLを正しく解決できない
- コンソールに警告が表示: `⚠ metadataBase property in metadata export is not set for resolving social open graph or twitter images, using "http://localhost:3004"`

**証拠**:
- `frontend/app/layout.tsx:8-33` - metadata オブジェクトに metadataBase がない
- ブラウザコンソール: 警告メッセージが表示

### 2. OGP画像URLの不一致
**問題**: Open Graph 用と Twitter 用の画像URLが異なるドメインになっている

**実際のHTMLメタタグ出力**:
```html
<!-- Open Graph (間違ったパス - Next.jsの自動生成) -->
<meta property="og:image" content="http://localhost:3004/polls/15f97ab0-88cb-404c-b8e0-cf5c070ff24c/opengraph-image-lqfnqv?f52d36d192de4683"/>

<!-- Twitter (正しいパス - API Route) -->
<meta name="twitter:image" content="http://localhost:3006/api/og?pollId=15f97ab0-88cb-404c-b8e0-cf5c070ff24c"/>

<!-- canonical URLも不一致 -->
<link rel="canonical" href="http://localhost:3006/polls/15f97ab0-88cb-404c-b8e0-cf5c070ff24c"/>
```

**原因分析**:
1. metadataBase が設定されていないため、Next.js は現在の接続URL (`localhost:3004`) を使用
2. `layout.tsx:132` では `/api/og?pollId=${id}` という相対パスを指定
3. Next.js が metadataBase なしで相対パスを解決しようとし、誤ったURLを生成
4. `.env.local` の `NEXT_PUBLIC_APP_URL` は `http://localhost:3006` だが、実際のフロントエンドは3004で起動

### 3. 環境変数とポートの不一致
**問題**: `.env.local` と実際の起動ポートが異なる

**証拠**:
- `.env.local:5` - `NEXT_PUBLIC_APP_URL=http://localhost:3006`
- 実際の起動: `http://localhost:3004` (3000が使用中のため自動的に3004に変更)

## シェアボタンの動作確認

### ShareDialog コンポーネントの実装
**ファイル**: `frontend/components/features/share/ShareDialog.tsx`

**シェア方式**:
- Web Share API は使用していない
- SNS URLスキームを使用:
  - Twitter: `https://twitter.com/intent/tweet`
  - Facebook: `https://www.facebook.com/sharer/sharer.php`
  - LINE: `https://line.me/R/msg/text/`

**問題点**:
1. これらのSNSサービスは、シェア時にURLを取得してOGPメタタグを読み取る
2. OGP画像のURLが間違っているため、正しいサムネイル画像を取得できない
3. metadataBase がないため、画像URLが不完全または誤ったものになる

## 修正方針

### 優先度: 高

#### 1. ルートレイアウトに metadataBase を追加
**ファイル**: `frontend/app/layout.tsx:8-33`

**修正内容**:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: "みんなの投票 - 誰でも簡単に参加できる投票プラットフォーム",
  // ... 残りのメタデータ
};
```

**効果**:
- OGP画像の相対URLが正しく解決される
- 警告メッセージが消える
- SNSクローラーが正しい画像URLにアクセスできる

#### 2. 環境変数の整合性を確保
**ファイル**: `.env.local`

**選択肢A**: 環境変数を実際のポートに合わせる
```
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

**選択肢B**: デフォルトポート3000を使用するように統一
- 3000ポートを使用している他のプロセスを停止
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` のまま維持

**推奨**: 選択肢B（開発環境の標準化）

### 優先度: 中

#### 3. OGP画像URLの明示的な絶対パス指定
**ファイル**: `frontend/app/(main)/polls/[id]/layout.tsx:130-137`

**現在のコード**:
```typescript
images: [
  {
    url: `${appUrl}/api/og?pollId=${id}`,  // 既に絶対パスを使用
    width: 1200,
    height: 630,
    alt: metadata.title,
  },
],
```

**確認事項**:
- metadataBase 設定後、この実装が正しく動作するか確認
- 必要に応じて Twitter メタタグも同じURLを使用

### 優先度: 低

#### 4. 削除済みの opengraph-image.tsx ファイルの影響確認
**状況**:
- `frontend/app/(main)/polls/[id]/opengraph-image.tsx` が削除されている
- これは正しい対応（API Route `/api/og` を使用しているため）

**確認事項**:
- Next.js が自動的に生成しようとしている `opengraph-image-lqfnqv` パスの原因を調査
- metadataBase 設定後、この問題が解消されるか確認

## 検証手順

### 1. 修正実施後の確認
1. metadataBase を追加
2. サーバーを再起動（3000ポートで起動することを確認）
3. 投票ページにアクセス: `http://localhost:3000/polls/{poll-id}`

### 2. OGPメタタグの検証
```bash
curl -s http://localhost:3000/polls/{poll-id} | grep -E "(og:|twitter:)"
```

**期待される出力**:
```html
<meta property="og:image" content="http://localhost:3000/api/og?pollId={poll-id}"/>
<meta name="twitter:image" content="http://localhost:3000/api/og?pollId={poll-id}"/>
<link rel="canonical" href="http://localhost:3000/polls/{poll-id}"/>
```

### 3. OGP画像生成の確認
```bash
curl -I http://localhost:3000/api/og?pollId={poll-id}
```

**期待される出力**:
```
HTTP/1.1 200 OK
Content-Type: image/png
```

### 4. シェアボタンの動作確認
1. 投票ページでシェアボタンをクリック
2. Twitter/Facebook/LINEでシェアを試行
3. シェアプレビューにサムネイル画像が表示されることを確認

### 5. SNS デバッガーでの検証
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- 各ツールでURLを入力し、OGP画像が正しく取得されることを確認

## 技術的な背景

### Next.js 15 の metadataBase
**公式ドキュメント**: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase

**重要なポイント**:
1. metadataBase はルートレイアウトで設定し、全ルートに適用される
2. 相対URLを含むメタデータフィールド（OpenGraph images、Twitter imagesなど）の解決に使用される
3. metadataBase がない場合、Next.js は現在のリクエストURLをベースとして使用（開発環境で不安定）

### OGP画像の要件
- **Twitter**: 最大5MB、推奨サイズ 1200x630
- **Facebook**: 最大8MB、推奨サイズ 1200x630
- **LINE**: 推奨サイズ 1200x630

現在の実装（`/api/og`）はこれらの要件を満たしています。

## まとめ

### 問題の本質
**ユーザーの報告**: 「シェアボタンクリック時にシェアのサムネイル画像が添付されていない」

**真の原因**:
1. **metadataBase の欠落** → OGP画像URLが正しく解決されない
2. **環境変数とポートの不一致** → 異なるURLが生成される
3. **結果**: SNSクローラーが正しいOGP画像にアクセスできない

### 前回の誤診断
前回は `opengraph-image.tsx` の削除が原因と判断しましたが、実際には：
- `opengraph-image.tsx` は使用されていない冗長なファイル
- API Route (`/api/og`) が正しく実装されている
- 真の原因は metadataBase の欠落

### 修正の優先順位
1. **高**: metadataBase の追加（必須）
2. **高**: 環境変数とポートの整合性確保
3. **中**: OGP画像URLの動作確認
4. **低**: 自動生成パスの原因調査（metadataBase 設定後に自然解決する可能性大）

### 期待される結果
修正後、以下が実現されます：
1. OGP画像URLが正しく解決される
2. SNSシェア時にサムネイル画像が正しく表示される
3. コンソール警告が消える
4. 全てのメタタグのURLが統一される

## 参考情報

### コードレビューでの指摘事項
- metadataBase の欠落に関する警告
- API Route (`/api/og`) が正常に動作していることの確認
- `opengraph-image.tsx` が冗長であることの指摘

### 関連ファイル
- `frontend/app/layout.tsx` - ルートレイアウト（修正対象）
- `frontend/app/(main)/polls/[id]/layout.tsx` - 投票ページメタデータ
- `frontend/app/api/og/route.tsx` - OGP画像生成API（正常動作）
- `frontend/components/features/share/ShareDialog.tsx` - シェアボタン実装
- `frontend/.env.local` - 環境変数設定

### Next.js ドキュメント
- [Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase)
