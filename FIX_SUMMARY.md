# 投票期間フィルタ不具合の修正概要

日付: 2025-01-17

## 問題の内容
投票期間フィルタ（期間中/期間外）が正しく機能していない不具合

## 根本原因
1. **バックエンドAPIの問題**: `active`パラメータを処理していなかった
   - フロントエンドは`active`パラメータを送信していたが、バックエンド側で無視されていた
   - 常に期限なし または 期限が未来の投票のみを返すハードコーディングがあった

2. **テストデータの不足**: 期限切れの投票データがなかった
   - シードデータに過去の期限を持つ投票が存在しなかった

## 修正内容

### 1. バックエンドの修正

#### `backend/src/services/polls.service.ts`
- `PollFilters`インターフェースに`active?: boolean`を追加
- `getPolls`関数で`active`パラメータに基づくフィルタリング処理を実装
  - `active === true`: 期限なし または 期限が未来の投票を表示
  - `active === false`: 期限が過去の投票を表示
  - `active === undefined`: すべての投票を表示（フィルタなし）

#### `backend/src/controllers/polls.controller.ts`
- リクエストパラメータから`active`を取得する処理を追加
- 文字列 "true"/"false" を boolean に変換

### 2. テストデータの追加

#### `backend/prisma/seed.ts`
- 過去の期限を持つ2つの投票を追加
  - 「2024年ベストアニメ【終了】」（2024-12-31終了）
  - 「年末年始の過ごし方【終了】」（2025-01-07終了）

### 3. ビルド用スクリプトの作成
- `backend/rebuild.bat` (Windows用)
- `backend/rebuild.sh` (Unix/Mac用)

## 動作確認方法

### 1. バックエンドの再ビルド
```bash
cd backend
# Windows
rebuild.bat
# Unix/Mac
./rebuild.sh
```

### 2. サーバーの再起動
```bash
# バックエンド
cd backend
npm run dev

# フロントエンド
cd ../frontend
npm run dev
```

### 3. フィルタの動作確認
- ブラウザで http://localhost:3000 にアクセス
- 「投票期間フィルタ」のスイッチを切り替えて確認
  - 「期間中」: 期限なし または 未来の期限を持つ投票が表示される
  - 「期間外」: 過去の期限を持つ投票（終了済み）が表示される

### 4. APIの直接テスト
```bash
# 期間中の投票のみ
curl "http://localhost:3001/api/polls?active=true"

# 期間外の投票のみ
curl "http://localhost:3001/api/polls?active=false"

# すべての投票
curl "http://localhost:3001/api/polls"
```

## 注意事項
- データベースのリセットが必要なため、`npm run prisma:reset`を実行してください
- 既存のデータは削除されるので、本番環境では注意が必要です