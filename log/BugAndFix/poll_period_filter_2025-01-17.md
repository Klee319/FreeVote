# 投票期間フィルタ不具合調査報告書

作成日: 2025-01-17
調査者: Claude Code

## 不具合・エラーの概要

投票期間フィルタが正しく機能していない問題
- フロントエンドで「期間中」「期間外」のフィルタが設定されているが、期待通りに動作しない
- モックデータのほとんどは期限切れのはずだが、「期間中」でも表示される

## 考察した原因

### 1. フロントエンドの期待と実装のミスマッチ
**フロントエンド（frontend/app/page.tsx）**:
- `showActivePollsOnly`という状態変数でフィルタを管理
- APIに`active`パラメータとして送信している（26-27行目）

```typescript
const params: any = {
  sort: sortBy,
  order: sortOrder,
  active: showActivePollsOnly,  // このパラメータを送信
};
```

### 2. バックエンドがactiveパラメータを処理していない
**バックエンド（backend/src/services/polls.service.ts）**:
- `active`パラメータを受け取っていない
- 常に`deadline`が未来の投票のみを返すハードコーディングされた条件がある（40-44行目）

```typescript
const where: any = {
  status: 'active',
  OR: [
    { deadline: null },          // 期限なし
    { deadline: { gt: new Date() } },  // 期限が未来のもののみ
  ],
};
```

### 3. モックデータの状況
**シードデータ（backend/prisma/seed.ts）**:
- 5つのサンプル投票のうち、1つ（「犬派？猫派？」）のみ7日後の期限を設定
- 他の4つはdeadlineがnull（期限なし）として作成される
- つまり、5つすべてが「期間中」として扱われる

## 実際に修正すべき原因

1. **バックエンドAPIの問題**：
   - `active`パラメータが処理されていない
   - 期間外の投票を取得する方法がない

2. **フロントエンドの誤解**：
   - `active`パラメータが機能すると期待しているが、実装されていない

## 修正内容と修正箇所

### 修正方針1: バックエンドAPIを修正（推奨）

**修正箇所**: `backend/src/controllers/polls.controller.ts`
```typescript
// 11行目付近に追加
active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
```

**修正箇所**: `backend/src/services/polls.service.ts`
```typescript
// PollFiltersインターフェースに追加
interface PollFilters {
  category?: string;
  search?: string;
  sort?: 'new' | 'trending' | 'voteCount';
  page?: number;
  limit?: number;
  active?: boolean;  // 追加
}

// getPolls関数内で条件を変更（38-45行目）
const where: any = {
  status: 'active',
};

// activeパラメータに応じて期間フィルタを適用
if (filters.active !== undefined) {
  if (filters.active) {
    // 期間中の投票のみ
    where.OR = [
      { deadline: null },
      { deadline: { gt: new Date() } },
    ];
  } else {
    // 期間外の投票のみ
    where.deadline = { lt: new Date() };
  }
} else {
  // パラメータがない場合はすべて表示（互換性のため）
  // または従来の動作を維持
}
```

### 修正方針2: テストデータの追加

期間外のテストデータを追加して、フィルタ機能を確認できるようにする：

**修正箇所**: `backend/prisma/seed.ts`
```typescript
// 過去の期限を持つ投票を追加
{
  title: '2024年ベストアニメ',
  description: '2024年に放送されたアニメで最も良かった作品は？',
  options: [/* ... */],
  categories: ['エンタメ', 'アニメ'],
  deadline: new Date('2024-12-31'), // 過去の日付
},
```

## 修正後の動作確認方法

1. **バックエンドの動作確認**:
   ```bash
   # 期間中の投票のみ取得
   curl "http://localhost:3001/api/polls?active=true"

   # 期間外の投票のみ取得
   curl "http://localhost:3001/api/polls?active=false"

   # すべての投票を取得（activeパラメータなし）
   curl "http://localhost:3001/api/polls"
   ```

2. **フロントエンドの動作確認**:
   - 投票期間フィルタのスイッチを切り替える
   - 「期間中」選択時：期限なしまたは未来の期限を持つ投票のみ表示
   - 「期間外」選択時：過去の期限を持つ投票のみ表示

3. **データベースの確認**:
   ```sql
   -- 期間中の投票
   SELECT * FROM Poll WHERE deadline IS NULL OR deadline > datetime('now');

   -- 期間外の投票
   SELECT * FROM Poll WHERE deadline < datetime('now');
   ```

## 推奨事項

1. **即座の対応**:
   - バックエンドAPIに`active`パラメータの処理を実装
   - テスト用に過去の期限を持つ投票データを追加

2. **将来的な改善**:
   - フィルタオプションの拡張（「今週締切」「今月締切」など）
   - 期限までの残り時間表示
   - 締切間近の投票への視覚的な強調表示

3. **ドキュメント化**:
   - APIドキュメントに`active`パラメータを追記
   - フロントエンドとバックエンドの期待値を明確化