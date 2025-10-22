# 不具合調査報告書 - 詳細統計アクセス制御の不具合

**作成日**: 2025-10-22
**優先度**: High
**ステータス**: 原因特定完了、修正方針策定完了

---

## 1. 不具合・エラーの概要

### 現象

ゲストユーザーがシェアボタンをクリックし、Twitter/Facebook/LINEボタンをクリックすると：

1. 「シェアありがとうございます！詳細統計に7日間アクセスできるようになりました」というメッセージが表示される
2. しかし、ページをリロードしても詳細統計セクションは表示されず、「詳細統計を見るには」プロンプトが残る
3. シェアによるアクセス権限付与が永続化されていない

### 期待動作

- ゲストユーザーがシェアを実行すると、7日間詳細統計（年齢別・性別別・地域別）にアクセス可能
- ページリロード後も詳細統計が表示される
- `DetailAccessPrompt`コンポーネントに「あとX日間利用可能」と表示される

---

## 2. 考察した原因

### 原因調査の流れ

#### Step 1: フロントエンドの確認

**ファイル**: `frontend/hooks/useStatsAccess.ts`

- `checkAccess`関数（13-38行目）: APIから`StatsAccessInfo`を取得
- `grantAccess`関数（41-60行目）: シェア時にAPI呼び出し後、`checkAccess`を再実行

**期待される動作**:
```typescript
export interface StatsAccessInfo {
  hasAccess: boolean;
  expiresAt?: string;      // 有効期限
  grantedAt?: string;      // 付与日時
  platform?: string;       // シェアしたプラットフォーム
}
```

#### Step 2: ShareDialogの確認

**ファイル**: `frontend/components/features/share/ShareDialog.tsx`

- 78-91行目の`handleShareSuccess`関数: シェア後に`grantAccess(platform)`を呼び出し
- 正常に動作している

#### Step 3: PollStatisticsの確認

**ファイル**: `frontend/components/features/polls/PollStatistics.tsx`

- 44行目: `const { hasAccess, expiresAt, isLoading: isLoadingAccess } = useStatsAccess(poll.id);`
- 190-195行目: `!hasAccess`の場合、`DetailAccessPrompt`を表示
- `expiresAt`が存在する場合、緑色の「詳細統計を閲覧できます」カードを表示

**問題**: `hasAccess`が`false`のまま、`expiresAt`も`undefined`のまま

#### Step 4: バックエンドAPIの確認

**ファイル**: `backend/src/controllers/polls.controller.ts` (120-139行目)

```typescript
checkStatsAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const userToken = req.headers['x-user-token'] as string;
  const userId = req.user?.userId;

  if (!userToken) {
    res.json({
      success: true,
      data: { hasAccess: false },
    });
    return;
  }

  const hasAccess = await pollsService.hasUserSharedOrHasAccess(id, userToken, userId);

  res.json({
    success: true,
    data: { hasAccess },  // ❌ hasAccessのみ返している
  });
});
```

**問題発見**: レスポンスに`hasAccess`のみが含まれており、`expiresAt`、`grantedAt`、`platform`が含まれていない。

#### Step 5: pollsServiceの確認

**ファイル**: `backend/src/services/polls.service.ts` (539-547行目)

```typescript
async hasUserSharedOrHasAccess(pollId: string, userToken: string, userId?: string): Promise<boolean> {
  // 登録ユーザーの場合は常にtrue
  if (userId) {
    return true;
  }

  // ゲストユーザーの場合、DetailStatsAccessを確認
  return await statsAccessService.canAccessDetailStats(pollId, userToken, userId);
}
```

**問題発見**: この関数は`boolean`のみを返している。詳細な情報（`expiresAt`など）を取得していない。

#### Step 6: statsAccessServiceの確認

**ファイル**: `backend/src/services/stats-access.service.ts`

- `canAccessDetailStats`（17-37行目）: `boolean`のみを返す
- `checkAccess`（96-120行目）: **詳細情報を返す関数が存在する！**

```typescript
async checkAccess(pollId: string, userToken: string) {
  const access = await prisma.detailStatsAccess.findFirst({
    where: {
      pollId,
      userToken,
    },
  });

  if (!access) {
    return {
      hasAccess: false,
      expiresAt: null,
      isExpired: null,
    };
  }

  const isExpired = access.expiresAt < new Date();

  return {
    hasAccess: !isExpired,
    expiresAt: access.expiresAt,
    isExpired,
    grantedAt: access.grantedAt,
  };
}
```

**重要発見**: `statsAccessService.checkAccess`を使えば詳細情報を取得できるが、`pollsService.hasUserSharedOrHasAccess`は`canAccessDetailStats`（booleanのみ）を使用している。

---

## 3. 実際に修正すべき原因

### 根本原因

**バックエンドの`checkStatsAccess`エンドポイントが不完全なデータを返している**

1. **問題箇所1**: `backend/src/services/polls.service.ts` の`hasUserSharedOrHasAccess`関数
   - `boolean`のみを返している
   - 詳細情報（`expiresAt`、`grantedAt`など）を返していない

2. **問題箇所2**: `backend/src/controllers/polls.controller.ts` の`checkStatsAccess`コントローラー
   - `hasAccess`（boolean）のみをレスポンスに含めている
   - フロントエンドが期待する`StatsAccessInfo`型の完全なデータを返していない

### 副次的な問題

- `statsAccessService.checkAccess`という適切な関数が存在するのに、使用されていない
- `pollsService`に新しいメソッドを追加する必要がある

---

## 4. 修正内容と修正箇所

### 修正1: pollsServiceに新しいメソッドを追加

**ファイル**: `backend/src/services/polls.service.ts`

**追加位置**: 547行目の後（`hasUserSharedOrHasAccess`の後）

```typescript
// 詳細統計アクセス情報を取得（詳細版）
async getStatsAccessInfo(
  pollId: string,
  userToken: string,
  userId?: string
): Promise<{
  hasAccess: boolean;
  expiresAt?: Date;
  grantedAt?: Date;
  platform?: string;
}> {
  // 登録ユーザーの場合は常にアクセス可能
  if (userId) {
    return {
      hasAccess: true,
    };
  }

  // ゲストユーザーの場合、DetailStatsAccessの詳細情報を取得
  const accessInfo = await statsAccessService.checkAccess(pollId, userToken);

  // 詳細情報を含めて返却
  return {
    hasAccess: accessInfo.hasAccess,
    expiresAt: accessInfo.expiresAt || undefined,
    grantedAt: accessInfo.grantedAt || undefined,
    // platformは現在のスキーマに存在しないため省略
  };
}
```

**理由**:
- `statsAccessService.checkAccess`を活用して詳細情報を取得
- 登録ユーザーとゲストユーザーの両方に対応
- フロントエンドが期待する形式でデータを返す

---

### 修正2: checkStatsAccessコントローラーの修正

**ファイル**: `backend/src/controllers/polls.controller.ts`

**修正箇所**: 120-139行目

**修正前**:
```typescript
checkStatsAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const userToken = req.headers['x-user-token'] as string;
  const userId = req.user?.userId;

  if (!userToken) {
    res.json({
      success: true,
      data: { hasAccess: false },
    });
    return;
  }

  const hasAccess = await pollsService.hasUserSharedOrHasAccess(id, userToken, userId);

  res.json({
    success: true,
    data: { hasAccess },  // ❌ 不完全
  });
});
```

**修正後**:
```typescript
checkStatsAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const userToken = req.headers['x-user-token'] as string;
  const userId = req.user?.userId;

  if (!userToken) {
    res.json({
      success: true,
      data: { hasAccess: false },
    });
    return;
  }

  // 詳細なアクセス情報を取得
  const accessInfo = await pollsService.getStatsAccessInfo(id, userToken, userId);

  res.json({
    success: true,
    data: accessInfo,  // ✅ 完全な情報を返す
  });
});
```

**理由**:
- 新しい`getStatsAccessInfo`メソッドを使用
- フロントエンドが期待する`StatsAccessInfo`型の完全なデータを返す
- `expiresAt`、`grantedAt`を含む

---

### 修正3: （オプション）Prismaスキーマにplatformフィールドを追加

**ファイル**: `backend/prisma/schema.prisma`

**現状のDetailStatsAccessモデル**:
```prisma
model DetailStatsAccess {
  id         String   @id @default(uuid())
  pollId     String
  userToken  String
  expiresAt  DateTime
  grantedAt  DateTime @default(now())
  grantedBy  String   // 付与者のユーザーID

  poll Poll @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user User @relation(fields: [grantedBy], references: [id], onDelete: Cascade)

  @@unique([pollId, userToken])
  @@index([pollId])
  @@index([userToken])
  @@index([expiresAt])
}
```

**修正案（platformフィールドを追加）**:
```prisma
model DetailStatsAccess {
  id         String   @id @default(uuid())
  pollId     String
  userToken  String
  expiresAt  DateTime
  grantedAt  DateTime @default(now())
  grantedBy  String   // 付与者のユーザーID
  platform   String?  // シェアしたプラットフォーム（twitter, facebook, line）

  poll Poll @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user User @relation(fields: [grantedBy], references: [id], onDelete: Cascade)

  @@unique([pollId, userToken])
  @@index([pollId])
  @@index([userToken])
  @@index([expiresAt])
}
```

**マイグレーション実行**:
```bash
cd backend
npx prisma migrate dev --name add_platform_to_detail_stats_access
```

**修正が必要な箇所**:
- `backend/src/services/polls.service.ts` の`grantStatsAccessOnShare`（518-536行目）
- `backend/src/services/stats-access.service.ts` の`grantAccess`（47-88行目）

**理由**:
- ユーザーがどのプラットフォームでシェアしたかを記録できる
- フロントエンドで「Twitterでシェアしました」などの表示が可能
- 現時点では必須ではないため、オプションとして提案

---

## 5. 修正の優先順位と手順

### Priority 1 (Critical) - 即時修正が必要

#### 修正1: pollsServiceに`getStatsAccessInfo`メソッドを追加

**ファイル**: `backend/src/services/polls.service.ts`

**実装時間**: 5分

**実装内容**:
```typescript
// 547行目の後に追加
async getStatsAccessInfo(
  pollId: string,
  userToken: string,
  userId?: string
): Promise<{
  hasAccess: boolean;
  expiresAt?: Date;
  grantedAt?: Date;
}> {
  if (userId) {
    return { hasAccess: true };
  }

  const accessInfo = await statsAccessService.checkAccess(pollId, userToken);

  return {
    hasAccess: accessInfo.hasAccess,
    expiresAt: accessInfo.expiresAt || undefined,
    grantedAt: accessInfo.grantedAt || undefined,
  };
}
```

#### 修正2: `checkStatsAccess`コントローラーを修正

**ファイル**: `backend/src/controllers/polls.controller.ts`

**実装時間**: 2分

**修正箇所**: 133-138行目

**修正前**:
```typescript
const hasAccess = await pollsService.hasUserSharedOrHasAccess(id, userToken, userId);

res.json({
  success: true,
  data: { hasAccess },
});
```

**修正後**:
```typescript
const accessInfo = await pollsService.getStatsAccessInfo(id, userToken, userId);

res.json({
  success: true,
  data: accessInfo,
});
```

### Priority 2 (Medium) - 機能強化（オプション）

#### 修正3: platformフィールドの追加

**実装時間**: 15分（スキーマ変更、マイグレーション、関連コード修正）

**実装順序**:
1. Prismaスキーマを修正
2. マイグレーション実行
3. `statsAccessService.grantAccess`を修正してplatformを受け取る
4. `pollsService.grantStatsAccessOnShare`を修正してplatformを渡す
5. `ShareDialog.tsx`の`handleShareSuccess`でplatformを渡す

**注意**: この修正は現在の不具合修正には不要。将来的な機能強化として実装可能。

---

## 6. テスト方法

### 6.1 ローカル環境でのテスト

#### Step 1: バックエンドの修正を適用

```bash
cd backend
# 修正後、サーバーを再起動
npm run dev
```

#### Step 2: APIの動作確認（修正前）

```bash
# user-tokenを設定（ゲストユーザーとして）
USER_TOKEN="test-guest-token-12345"

# アクセス権限を確認（修正前は hasAccess のみ）
curl -H "x-user-token: $USER_TOKEN" \
  http://localhost:5001/api/polls/bd1821fb-ba79-419a-957b-6d5f44392d43/has-stats-access

# 期待されるレスポンス（修正前）:
# {"success":true,"data":{"hasAccess":false}}
```

#### Step 3: シェアによるアクセス権限付与

```bash
# シェアを実行してアクセス権限を付与
curl -X POST \
  -H "x-user-token: $USER_TOKEN" \
  http://localhost:5001/api/polls/bd1821fb-ba79-419a-957b-6d5f44392d43/share-grant-access

# 期待されるレスポンス:
# {"success":true,"message":"Access granted successfully"}
```

#### Step 4: アクセス権限を再確認（修正後）

```bash
curl -H "x-user-token: $USER_TOKEN" \
  http://localhost:5001/api/polls/bd1821fb-ba79-419a-957b-6d5f44392d43/has-stats-access

# 期待されるレスポンス（修正後）:
# {
#   "success": true,
#   "data": {
#     "hasAccess": true,
#     "expiresAt": "2025-10-29T...",
#     "grantedAt": "2025-10-22T..."
#   }
# }
```

### 6.2 フロントエンドでのテスト

#### Step 1: フロントエンドを起動

```bash
cd frontend
npm run dev
```

#### Step 2: ブラウザで投票ページを開く

```
http://localhost:3000/polls/bd1821fb-ba79-419a-957b-6d5f44392d43
```

#### Step 3: ゲストユーザーとしてシェアを実行

1. 「シェア」ボタンをクリック
2. Twitter/Facebook/LINEいずれかのボタンをクリック
3. 「シェアありがとうございます！詳細統計に7日間アクセスできるようになりました」メッセージを確認

#### Step 4: ページをリロード

期待される動作:
- 詳細統計セクションが表示される
- 「詳細統計を閲覧できます」という緑色のカードが表示される
- 「あと7日間利用可能（2025年10月29日まで）」と表示される
- 年代別・性別・都道府県別のタブが表示され、データが閲覧可能

#### Step 5: ローカルストレージを確認

開発者ツールを開き、Application > Local Storage を確認:
- `vote-token-bd1821fb-ba79-419a-957b-6d5f44392d43` キーが存在することを確認
- このトークンがバックエンドに送信されている

#### Step 6: ネットワークタブで確認

1. ページリロード後、Network タブで以下のリクエストを確認:
   - `GET /api/polls/.../has-stats-access`
   - Request Headers に `x-user-token` が含まれている
   - Response に `hasAccess: true`、`expiresAt`、`grantedAt` が含まれている

### 6.3 デバッグ方法

#### 問題: シェア後もhasAccessがfalseのまま

**確認ポイント**:
1. ローカルストレージに`vote-token-{pollId}`が存在するか
2. APIリクエストに`x-user-token`ヘッダーが含まれているか
3. バックエンドの`DetailStatsAccess`テーブルにレコードが作成されているか

**SQLで確認**:
```sql
-- DetailStatsAccessテーブルを確認
SELECT * FROM "DetailStatsAccess"
WHERE "pollId" = 'bd1821fb-ba79-419a-957b-6d5f44392d43'
ORDER BY "grantedAt" DESC;
```

#### 問題: expiresAtがundefinedのまま

**原因**: バックエンドの修正が適用されていない

**確認**:
```bash
# APIレスポンスを確認
curl -H "x-user-token: test-token" \
  http://localhost:5001/api/polls/bd1821fb-ba79-419a-957b-6d5f44392d43/has-stats-access
```

期待されるレスポンス:
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "expiresAt": "2025-10-29T12:34:56.789Z",
    "grantedAt": "2025-10-22T12:34:56.789Z"
  }
}
```

---

## 7. 関連ドキュメント

- [Phase 2要件5: 詳細統計へのアクセス制限](../../ref/phase2/05_detailed_stats_access.md)
- [Prisma Schema: DetailStatsAccess](../../backend/prisma/schema.prisma)
- [StatsAccessService](../../backend/src/services/stats-access.service.ts)

---

## 8. 備考

### 8.1 なぜこの不具合が発生したか

**実装時の設計ミス**:
1. `hasUserSharedOrHasAccess`という名前の関数を作成したが、booleanのみを返す設計にしてしまった
2. `statsAccessService.checkAccess`という詳細情報を返す関数が存在していたが、使用されなかった
3. フロントエンドとバックエンドのインターフェースの不一致が見逃された

**教訓**:
- APIエンドポイントの実装時は、フロントエンドの型定義を確認する
- 類似の機能がサービス層に既に存在しないか確認する
- E2Eテストがあれば、このような不具合は早期に発見できた

### 8.2 今後の改善提案

1. **E2Eテストの追加**:
   - Playwrightを使用して、シェア→リロード→詳細統計表示のフローをテスト

2. **型安全性の強化**:
   - バックエンドのレスポンス型を明示的に定義
   - フロントエンドの`StatsAccessInfo`型とバックエンドのレスポンス型を一致させる

3. **APIドキュメントの整備**:
   - OpenAPI/Swagger仕様を作成
   - エンドポイントのリクエスト/レスポンス形式を明示

---

**調査者**: Claude (Opus 4.1)
**レビュー**: 未実施
**ステータス**: 修正方針策定完了、実装待ち
