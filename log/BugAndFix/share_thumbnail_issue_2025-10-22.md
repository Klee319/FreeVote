# シェア機能サムネイル画像不具合調査レポート

## 調査日時
2025-10-22

## 問題の概要
シェアボタンをクリックした際に、SNSシェア時のサムネイル画像（OGP画像）が添付されない不具合が発生。

## 1. 問題の原因

### 根本原因
**`frontend/app/(main)/polls/[id]/opengraph-image.tsx` ファイルが削除されている**

- Git status で確認したところ、このファイルが削除状態（deleted）になっている
- このファイルは Next.js 15 のファイルベースのOG画像自動生成機能において必須のファイル
- Next.js は `opengraph-image.tsx` ファイルの存在を検知して自動的にOG画像を生成するが、ファイルが存在しない場合は画像が生成されない

### 現在の実装状況

#### 正常に動作している部分
1. **APIエンドポイント（`/api/og`）**
   - `frontend/app/api/og/route.tsx` は存在し、正常に動作
   - curl でのテストで HTTP 200 を返し、image/png のヘッダーも正しく設定されている
   - 画像生成ロジック自体は問題ない

2. **バックエンドAPI**
   - `/api/polls/:id/share-metadata` エンドポイントは正常動作
   - 必要なメタデータを正しく返している

3. **メタタグ生成（`layout.tsx`）**
   - `frontend/app/(main)/polls/[id]/layout.tsx` の generateMetadata 関数は正常
   - OG画像URLは `/api/og?pollId={id}` として正しく設定されている

#### 動作していない部分
- SNSプラットフォーム（Twitter、Facebook等）がページをクロールする際、Next.jsの標準的な `opengraph-image.tsx` を探すが、ファイルが存在しないため画像が取得できない

## 2. 影響範囲

### 影響を受けるファイルとコード
- **削除されたファイル**: `frontend/app/(main)/polls/[id]/opengraph-image.tsx`
- **影響するユーザー機能**:
  - Twitter、Facebook、LINEでのシェア時にサムネイル画像が表示されない
  - シェアされた投稿の見栄えが悪く、クリック率が下がる可能性

### 影響を受けないファイル
- `frontend/app/api/og/route.tsx` - APIルート自体は正常
- `frontend/app/(main)/polls/[id]/layout.tsx` - メタデータ生成は正常
- `frontend/components/features/share/ShareDialog.tsx` - シェアダイアログ自体は正常動作

## 3. 修正方針

### 方法1: opengraph-image.tsxファイルの復元（推奨）
**ファイルパス**: `frontend/app/(main)/polls/[id]/opengraph-image.tsx`

削除された `opengraph-image.tsx` ファイルを復元する。このファイルは Next.js 15 の標準的なOG画像生成の仕組みで必要。

```bash
# Gitから削除されたファイルを復元
git restore frontend/app/(main)/polls/[id]/opengraph-image.tsx
```

### 方法2: API ルートへのリダイレクト実装（代替案）
既存の `/api/og` エンドポイントを活用する場合、`opengraph-image.tsx` で単純にAPIにリダイレクトする実装も可能。

**新規作成ファイル**: `frontend/app/(main)/polls/[id]/opengraph-image.tsx`
```typescript
import { ImageResponse } from 'next/og';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // 既存のAPIエンドポイントにリダイレクト
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  redirect(`${appUrl}/api/og?pollId=${id}`);
}
```

## 4. 修正優先度

| 項目 | 優先度 | 理由 |
|------|--------|------|
| opengraph-image.tsx ファイルの復元 | **高** | SNSシェア機能の核心部分であり、ユーザー体験に直結 |
| 動作確認（開発環境） | **高** | 修正後すぐに確認が必要 |
| 本番環境へのデプロイ | **高** | ユーザーに影響がある機能のため早急な対応が必要 |

## 5. 推奨事項

1. **即時対応**
   - `git restore` コマンドで削除されたファイルを復元
   - 開発環境で動作確認

2. **動作確認手順**
   - Facebook デバッガー（https://developers.facebook.com/tools/debug/）でOG画像を確認
   - Twitter Card Validator でプレビューを確認
   - 実際にシェアしてみて画像が表示されることを確認

3. **今後の対策**
   - 重要なファイルを削除する前に影響範囲を確認
   - OG画像関連のファイルには特に注意を払う
   - CI/CDパイプラインでOG画像の存在をテストする仕組みの導入を検討

## まとめ
この不具合は `opengraph-image.tsx` ファイルの誤削除が原因です。ファイルを復元するだけで問題は解決します。Next.js 15 では、このファイルベースの規約に従うことで自動的にOG画像が生成される仕組みになっているため、このファイルの存在が必須です。