# バグレポート: currentPoll.categories.map TypeError

## 不具合・エラーの概要
フロントエンド（`/polls/[id]`ページ）で`Runtime TypeError: Cannot read properties of undefined (reading 'map')`が発生。
エラー発生箇所：`frontend/app/polls/[id]/page.tsx`の130行目

## 考察した原因
バックエンドAPIとフロントエンドのデータ構造の不整合が原因：

1. **バックエンドAPIのレスポンス形式**：
   - `/api/polls/:id`エンドポイントは以下の形式でデータを返す：
   ```json
   {
     "success": true,
     "data": {
       "poll": {         // 実際の投票データ
         "id": "...",
         "title": "...",
         "categories": [...],
         // ...その他のフィールド
       },
       "results": {      // 集計結果
         "totalVotes": 100,
         "options": [...],
         "topOption": {...}
       }
     }
   }
   ```

2. **フロントエンドのデータ処理の問題**：
   - `usePolls`フックの`fetchPoll`関数で`response.data`全体を`currentPoll`ステートに設定していた
   - つまり、`currentPoll`には`{ poll: {...}, results: {...} }`というオブジェクトが格納されていた
   - そのため`currentPoll.categories`は存在せず（`currentPoll.poll.categories`が正しい）、TypeErrorが発生

## 実際に修正した原因
APIレスポンスから正しいpollオブジェクトを抽出していなかったことが根本原因

## 修正内容と修正箇所

### 1. `frontend/hooks/usePolls.ts`の修正（63-69行目）
- `fetchPoll`メソッドでAPIレスポンスの構造を正しく処理：
  ```typescript
  // 修正前
  setCurrentPoll(response.data);

  // 修正後
  if (response.data.poll) {
    setCurrentPoll(response.data.poll);    // pollオブジェクトのみを設定
    // 必要に応じてresultsデータも別途管理
  } else {
    setCurrentPoll(response.data);         // 後方互換性のため
  }
  ```

### 2. `frontend/app/polls/[id]/page.tsx`の修正（防御的プログラミング追加）
- categories配列の存在チェック：
  ```typescript
  // 130-134行目を修正
  {currentPoll.categories && Array.isArray(currentPoll.categories) &&
    currentPoll.categories.map((category) => (
      <Badge key={category} variant="secondary">
        {category}
      </Badge>
    ))}
  ```

### 3. 関連する型定義やデータ表示部分の修正
- PollResultsコンポーネントなど、投票結果データを使用する箇所でも同様の修正が必要

## 修正の効果
- TypeErrorが解消され、投票詳細ページが正常に表示される
- カテゴリーバッジが正しく表示される
- 投票結果も適切に表示される

## 修正実施内容（最終版）

修正を以下の2ファイルに実施：

1. **`frontend/hooks/usePolls.ts`（63-83行目）**：
   - fetchPoll関数でAPIレスポンスの構造を正しく処理するように修正
   - `response.data.poll`が存在する場合はそれをcurrentPollに設定
   - 後方互換性のため、直接pollオブジェクトが返される場合にも対応

2. **`frontend/app/polls/[id]/page.tsx`（130-135行目）**：
   - categoriesの存在チェックと配列チェックを追加
   - 防御的プログラミングによりundefinedエラーを防止

## 動作確認結果
- バックエンドAPI（`/api/polls/:id`）は正しく動作し、categoriesを配列として返していることを確認
- フロントエンドの修正により、TypeErrorが解消される見込み

## 備考
この不具合は典型的なAPI-フロントエンド間のデータ構造の不整合によるものであり、適切なデータ抽出と型チェックにより根本的に解決される。