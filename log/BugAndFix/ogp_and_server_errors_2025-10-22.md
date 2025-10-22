# 不具合調査報告書 - OGP画像とサーバーエラー

**作成日**: 2025-10-22
**優先度**: Critical (500エラー), High (OGP画像404), Medium (キャッシュ/metadataBase)

---

## 1. 不具合・エラーの概要

サーバーログから以下の5つの問題が発見されました：

### 1.1 Critical: 500エラー発生
```
GET /polls/bd1821fb-ba79-419a-957b-6d5f44392d43 500 in 675ms
```
- エンドポイント: `GET /api/polls/:id/share-metadata`
- 頻度: 複数回発生
- 影響: OGPメタデータ取得失敗によりSNSシェアが正常動作しない

### 1.2 High: OGP画像の404エラー
```
HEAD /polls/bd1821fb-ba79-419a-957b-6d5f44392d43/opengraph-image 404 in 756ms
GET /polls/bd1821fb-ba79-419a-957b-6d5f44392d43/opengraph-image 404 in 4779ms
```
- 影響: SNSシェア時にOGP画像が表示されない

### 1.3 High: Jest workerエラー
```
⨯ Failed to generate static paths for /polls/[id]:
[Error: Jest worker encountered 2 child process exceptions, exceeding retry limit] {
  type: 'WorkerError'
}
```
- 影響: Next.jsビルド時の静的パス生成失敗

### 1.4 Medium: キャッシュ設定の競合
```
⚠ Specified "cache: no-store" and "revalidate: 60", only one should be specified.
```
- 場所: `frontend/app/(main)/polls/[id]/layout.tsx` (82-86行目)

### 1.5 Medium: metadataBase未設定
```
⚠ metadataBase property in metadata export is not set for resolving social open graph or twitter images
```

---

## 2. 考察した原因

### 2.1 500エラーの原因

**ファイル**: `backend/src/services/polls.service.ts` (517-565行目)

**問題箇所** (557行目):
```typescript
commentCount: poll.commentCount,  // ❌ このフィールドは存在しない
```

**原因分析**:
- Prismaクエリ(527-530行目)で`comments`リレーションを`include`している
- しかし、`poll.commentCount`というフィールドはPrismaスキーマに存在しない
- 正しくは`poll.comments.length`を使用すべき

**エビデンス**:
```typescript
// 現在のクエリ (519-532行目)
const poll = await prisma.poll.findUnique({
  where: { id: pollId },
  include: {
    votes: { select: { option: true } },
    comments: { select: { id: true } },  // ✅ commentsはincludeされている
  },
});

// しかし返却時に (557行目)
commentCount: poll.commentCount,  // ❌ poll.commentCountは存在しない
```

### 2.2 OGP画像404エラーの原因

**ファイル**: `frontend/app/(main)/polls/[id]/opengraph-image.tsx`

**原因分析** (Web検索結果より):

Next.js 15では動的ルート`[id]`内の`opengraph-image.tsx`がパス解決に失敗する既知の問題があります：

1. **動的ルートの曖昧性**: `/polls/opengraph-image`が以下のどちらかの解釈になる
   - `/polls`のOGP画像
   - `id="opengraph-image"`の投票ページ

2. **Next.jsのデフォルト動作**: 後者(動的パラメータ)として解釈されるため、OGP画像ルートとして認識されない

3. **Route Group制約**: `(main)`などのRoute Group内では更に問題が複雑化

**関連Issue**:
- [Next.js Issue #57349](https://github.com/vercel/next.js/issues/57349): opengraph-image breaks in dynamic routes
- [Next.js Issue #48106](https://github.com/vercel/next.js/issues/48106): opengraph-image is 404 in route group segments

### 2.3 キャッシュ設定競合の原因

**ファイル**: `frontend/app/(main)/polls/[id]/layout.tsx` (82-86行目)

```typescript
const response = await fetch(`${apiUrl}/polls/${id}/share-metadata`, {
  next: {
    revalidate: 60,  // ✅ 60秒ごとに再検証
  },
  cache: 'no-store',  // ❌ キャッシュしない（矛盾）
});
```

**原因**:
- `cache: 'no-store'`: 常に新しいデータを取得（キャッシュ無効）
- `revalidate: 60`: キャッシュを60秒ごとに再検証

これらは相互排他的な設定で、Next.js 15では両方指定すると警告が出て両方とも無視されます。

### 2.4 metadataBase未設定の原因

**ファイル**: `frontend/app/layout.tsx`

**問題**:
- OGP画像のURLが相対パス(`/polls/${id}/opengraph-image`)で指定されている
- しかし`metadataBase`が設定されていないため、完全なURLに解決できない

**影響**:
- SNSクローラーが正しい画像URLを取得できない可能性がある

### 2.5 Jest workerエラーの原因

**推定原因**:
1. OGP画像生成(opengraph-image.tsx)が500エラーを返す
2. Next.jsビルド時に静的パス生成で全投票IDに対してOGP画像生成を試みる
3. share-metadata APIが500エラーを返すため、OGP画像生成も失敗
4. Jestワーカーがリトライ限界を超えてクラッシュ

**根本原因**: 2.1の500エラー（commentCountフィールド不在）

---

## 3. 実際に修正すべき原因

上記の考察に基づき、以下の原因を修正します：

1. ✅ **500エラー**: `poll.commentCount` → `poll.comments.length`
2. ✅ **OGP画像404**: 動的ルートでの実装方法を変更
3. ✅ **キャッシュ競合**: `cache: 'no-store'`を削除し、`revalidate`のみ使用
4. ✅ **metadataBase**: root layout.tsxに`NEXT_PUBLIC_APP_URL`ベースで設定
5. ✅ **Jest workerエラー**: 500エラー修正により自動的に解決されるはず

---

## 4. 修正内容と修正箇所

### 修正1: 500エラーの修正（Critical）

**ファイル**: `backend/src/services/polls.service.ts`

**修正箇所**: 557行目

**修正前**:
```typescript
return {
  title: poll.title,
  description: poll.description,
  options: parsedOptions,
  categories: parsedCategories,
  totalVotes,
  commentCount: poll.commentCount,  // ❌ エラー
  thumbnailUrl: poll.thumbnailUrl,
  deadline: poll.deadline,
  voteCounts: Array.from(voteCounts.entries()).map(([option, count]) => ({
    option,
    count,
    percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
  })),
};
```

**修正後**:
```typescript
return {
  title: poll.title,
  description: poll.description,
  options: parsedOptions,
  categories: parsedCategories,
  totalVotes,
  commentCount: poll.comments.length,  // ✅ 修正
  thumbnailUrl: poll.thumbnailUrl,
  deadline: poll.deadline,
  voteCounts: Array.from(voteCounts.entries()).map(([option, count]) => ({
    option,
    count,
    percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
  })),
};
```

---

### 修正2: OGP画像404の修正（High）

**方針**: Next.js 15の制約により、動的ルート内での`opengraph-image.tsx`は使用できないため、**API Routeによる画像生成**に切り替えます。

**修正A: layout.tsxのOGP画像URL変更**

**ファイル**: `frontend/app/(main)/polls/[id]/layout.tsx`

**修正箇所**: 130-137行目

**修正前**:
```typescript
openGraph: {
  title: metadata.title,
  description: description.slice(0, 160),
  url: pollUrl,
  siteName: 'みんなの投票',
  images: [
    {
      url: `${appUrl}/polls/${id}/opengraph-image`,  // ❌ 404エラー
      width: 1200,
      height: 630,
      alt: metadata.title,
    },
  ],
  locale: 'ja_JP',
  type: 'website',
},
```

**修正後**:
```typescript
openGraph: {
  title: metadata.title,
  description: description.slice(0, 160),
  url: pollUrl,
  siteName: 'みんなの投票',
  images: [
    {
      url: `${appUrl}/api/og?pollId=${id}`,  // ✅ APIルートに変更
      width: 1200,
      height: 630,
      alt: metadata.title,
    },
  ],
  locale: 'ja_JP',
  type: 'website',
},
```

**修正B: APIルートの作成**

**新規ファイル**: `frontend/app/api/og/route.tsx`

```typescript
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { isValidUUID } from '@/lib/validation';

export const runtime = 'edge';

interface PollOption {
  label: string;
  id?: string;
  thumbnailUrl?: string;
  pitchPattern?: number[];
  voiceSampleUrl?: string;
}

interface ShareMetadata {
  title: string;
  description: string;
  options: (string | PollOption)[];
  categories: string[];
  totalVotes: number;
  commentCount: number;
  thumbnailUrl: string | null;
  deadline: Date | null;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');

    if (!pollId || !isValidUUID(pollId)) {
      return new Response('Invalid poll ID', { status: 400 });
    }

    // APIからデータ取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/polls/${pollId}/share-metadata`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch poll metadata');
    }

    const { data } = await response.json();
    const metadata: ShareMetadata = data;

    // 背景グラデーション
    const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    // 締切情報の計算
    let deadlineText = '無期限';
    if (metadata.deadline) {
      const now = new Date();
      const end = new Date(metadata.deadline);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        deadlineText = '終了';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
          deadlineText = `残り${days}日${hours}時間`;
        } else {
          deadlineText = `残り${hours}時間`;
        }
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: gradient,
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.2',
                marginBottom: '20px',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxHeight: '134px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {truncateText(metadata.title, 50)}
            </div>

            {/* Categories */}
            {metadata.categories && metadata.categories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {metadata.categories.slice(0, 3).map((category, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '20px',
                      color: 'white',
                      display: 'flex',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {truncateText(category, 10)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options List */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px',
                display: 'flex',
              }}
            >
              投票の選択肢
            </div>

            {metadata.options.slice(0, 4).map((option, idx) => {
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      display: 'flex',
                      maxWidth: '900px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {truncateText(optionLabel, 40)}
                  </div>
                </div>
              );
            })}

            {metadata.options.length > 4 && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#666',
                  fontStyle: 'italic',
                  display: 'flex',
                }}
              >
                ...他 {metadata.options.length - 4} 件の選択肢
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
              padding: '30px 40px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '18px', color: '#666', display: 'flex' }}>
                  総投票数
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea', display: 'flex' }}>
                  {metadata.totalVotes}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '18px', color: '#666', display: 'flex' }}>
                  コメント
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#764ba2', display: 'flex' }}>
                  {metadata.commentCount || 0}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '18px', color: '#666', display: 'flex' }}>
                  締切
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', display: 'flex' }}>
                  {deadlineText}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                padding: '20px 40px',
                borderRadius: '12px',
                display: 'flex',
              }}
            >
              👆 クリックして結果を見る
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);

    // エラー時のフォールバック画像
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            みんなの投票
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
```

**修正C: 既存のopengraph-image.tsxを削除**

**削除ファイル**: `frontend/app/(main)/polls/[id]/opengraph-image.tsx`

理由: Next.js 15の動的ルートでは機能しないため

---

### 修正3: キャッシュ設定競合の修正（Medium）

**ファイル**: `frontend/app/(main)/polls/[id]/layout.tsx`

**修正箇所**: 82-86行目

**修正前**:
```typescript
const response = await fetch(`${apiUrl}/polls/${id}/share-metadata`, {
  next: {
    revalidate: 60,  // 1分ごとに再検証
  },
  cache: 'no-store',  // ❌ 競合
});
```

**修正後**:
```typescript
const response = await fetch(`${apiUrl}/polls/${id}/share-metadata`, {
  next: {
    revalidate: 60,  // ✅ 1分ごとに再検証（cacheオプション削除）
  },
});
```

**理由**:
- OGPメタデータは頻繁に変わるものではないため、60秒のキャッシュが適切
- `cache: 'no-store'`を削除し、`revalidate`のみで制御

---

### 修正4: metadataBase設定の追加（Medium）

**ファイル**: `frontend/app/layout.tsx`

**修正箇所**: 8-33行目

**修正前**:
```typescript
export const metadata: Metadata = {
  title: "みんなの投票 - 誰でも簡単に参加できる投票プラットフォーム",
  description: "みんなの投票は、誰でも簡単に投票に参加でき、SNSで拡散しやすいプラットフォームです。アクセント投票から時事ネタまで、様々なテーマの投票に参加しましょう。",
  keywords: "投票,アンケート,アクセント,方言,SNS,シェア,ランキング",
  // metadataBaseが未設定 ❌
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://minna-no-touhyou.jp",
    // ...
  },
  // ...
};
```

**修正後**:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),  // ✅ 追加
  title: "みんなの投票 - 誰でも簡単に参加できる投票プラットフォーム",
  description: "みんなの投票は、誰でも簡単に投票に参加でき、SNSで拡散しやすいプラットフォームです。アクセント投票から時事ネタまで、様々なテーマの投票に参加しましょう。",
  keywords: "投票,アンケート,アクセント,方言,SNS,シェア,ランキング",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://minna-no-touhyou.jp",
    // ...
  },
  // ...
};
```

**理由**:
- 相対URLを完全修飾URLに解決するために必要
- SNSクローラーが正しい画像URLを取得できるようになる

---

### 修正5: Jest workerエラー

**対応**: なし（自動的に解決されるはず）

**理由**:
- 修正1（500エラー）と修正2（OGP画像404）により、ビルド時のOGP画像生成が正常に動作するようになるため、Jest workerエラーも解消されるはず
- もし解消されない場合は、ビルドログを再確認して追加調査が必要

---

## 5. 修正の優先順位

### Priority 1 (Critical) - 即時修正が必要
1. **500エラー修正** (polls.service.ts)
   - 影響範囲: share-metadata API全体
   - 修正時間: 1分
   - テスト: `GET /api/polls/:id/share-metadata`の動作確認

### Priority 2 (High) - 早急な修正が必要
2. **OGP画像404修正** (layout.tsx, 新規APIルート)
   - 影響範囲: SNSシェア機能
   - 修正時間: 10分
   - テスト: Twitter/Facebook Card Validatorで確認

### Priority 3 (Medium) - 修正が望ましい
3. **キャッシュ設定競合** (layout.tsx)
   - 影響範囲: パフォーマンスと開発時の警告
   - 修正時間: 1分
   - テスト: 警告メッセージの消失確認

4. **metadataBase設定** (root layout.tsx)
   - 影響範囲: OGP URL解決
   - 修正時間: 1分
   - テスト: 警告メッセージの消失確認

### Priority 4 (Watch) - 経過観察
5. **Jest workerエラー**
   - 対応: Priority 1-2の修正後に再ビルドして確認
   - 解消しない場合は追加調査

---

## 6. テスト方法

### 6.1 500エラー修正のテスト

```bash
# バックエンド起動
cd backend
npm run dev

# APIテスト
curl http://localhost:5001/api/polls/bd1821fb-ba79-419a-957b-6d5f44392d43/share-metadata

# 期待結果: 200 OK, commentCountフィールドが正常に返却される
```

### 6.2 OGP画像修正のテスト

```bash
# フロントエンド起動
cd frontend
npm run dev

# ブラウザでアクセス
http://localhost:3000/api/og?pollId=bd1821fb-ba79-419a-957b-6d5f44392d43

# 期待結果: OGP画像が表示される（1200x630のPNG）
```

**外部ツールでのテスト**:
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

### 6.3 キャッシュ設定のテスト

```bash
cd frontend
npm run dev

# 開発サーバーのログを確認
# 期待結果: 「cache: no-store」と「revalidate」の競合警告が消える
```

### 6.4 metadataBaseのテスト

```bash
cd frontend
npm run build

# ビルドログを確認
# 期待結果: metadataBase未設定の警告が消える
```

### 6.5 Jest workerエラーのテスト

```bash
cd frontend
npm run build

# ビルドログを確認
# 期待結果: "Failed to generate static paths" エラーが消える
```

---

## 7. 関連ドキュメント

- [Next.js 15 Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js 15 OG Image Generation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js Caching Guide](https://nextjs.org/docs/app/building-your-application/caching)
- [GitHub Issue #57349 - opengraph-image breaks in dynamic routes](https://github.com/vercel/next.js/issues/57349)

---

## 8. 備考

### 8.1 代替案検討

**OGP画像生成の代替案**:
1. ✅ **採用**: APIルート(`/api/og`)による動的生成
   - 長所: Next.js 15で確実に動作、動的パラメータに対応
   - 短所: ビルド時静的生成不可（ただし影響は軽微）

2. ❌ **不採用**: 静的画像の事前生成
   - 長所: 高速、サーバー負荷が低い
   - 短所: 投票ごとに異なるOGP画像が必要なため不適切

3. ❌ **不採用**: middleware rewriteによる解決
   - 長所: ルート構造を変えずに済む
   - 短所: Next.js 15のRoute Groupと相性が悪い

### 8.2 今後の注意点

- Next.js 16以降で動的ルートのopengraph-image.tsxサポートが改善される可能性があるため、将来的に見直しを検討
- OGP画像生成APIはEdge Runtimeで動作するため、Node.js APIの使用は不可
- キャッシュ戦略は今後のパフォーマンス測定結果に応じて調整を検討

---

**調査者**: Claude (Opus 4.1)
**レビュー**: 未実施
**ステータス**: 修正方針策定完了、実装待ち
