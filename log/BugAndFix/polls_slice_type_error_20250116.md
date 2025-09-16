# バグレポート: polls.slice is not a function エラー

## 不具合・エラーの概要
フロントエンド（localhost:3000）で`Runtime TypeError: polls.slice is not a function`が発生。
エラー発生箇所：`frontend/app/page.tsx`の69行目

## 考察した原因
バックエンドAPIとフロントエンドのデータ構造の不整合が原因：

1. **バックエンドAPIのレスポンス形式**：
   - `/api/polls`エンドポイントは以下の形式でデータを返す：
   ```json
   {
     "polls": [...],      // 投票データの配列
     "pagination": {      // ページネーション情報
       "page": 1,
       "limit": 20,
       "total": 100,
       "totalPages": 5
     }
   }
   ```

2. **フロントエンドのデータ処理**：
   - `usePolls`フックで`response.data`全体を`polls`ステートに設定していた
   - つまり、`polls`にはオブジェクトが格納されていた（配列ではなく）
   - そのため`polls.slice()`を呼び出した時にTypeErrorが発生

## 実際に修正した原因
APIレスポンスからpollsの配列部分を正しく抽出していなかったことが根本原因

## 修正内容と修正箇所

### 1. `frontend/stores/pollStore.ts`の修正
- `pagination`フィールドを追加
- `setPagination`アクションを追加
- ページネーション情報を適切に管理できるように改善

### 2. `frontend/hooks/usePolls.ts`の修正
- `fetchPolls`メソッドでAPIレスポンスの構造を正しく処理：
  ```typescript
  if (response.data.polls && Array.isArray(response.data.polls)) {
    setPolls(response.data.polls);        // pollsの配列部分のみを設定
    if (response.data.pagination) {
      setPagination(response.data.pagination);  // ページネーション情報も別途設定
    }
  }
  ```
- 後方互換性のため、配列が直接返される場合にも対応

### 3. `frontend/app/page.tsx`の修正
- 防御的プログラミングを追加：
  ```typescript
  const trendingPolls = Array.isArray(polls) ? polls.slice(0, 3) : [];
  const newPolls = Array.isArray(polls) ? polls.slice(3, 6) : [];
  ```
- 投票数表示でも同様の型チェックを追加

## 修正の効果
- TypeErrorが解消され、投票一覧が正常に表示される
- ページネーション情報も適切に管理される
- 将来的なAPIレスポンス形式の変更にも対応可能（後方互換性）

## 備考
この不具合は典型的なAPI-フロントエンド間のデータ構造の不整合によるものであり、適切なデータ抽出と型チェックにより根本的に解決された。