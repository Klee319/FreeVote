# 管理画面API接続エラー修正報告書

## 不具合・エラーの概要
日時: 2025-01-19
報告内容: 管理画面でPolls一覧を取得する際にAPIとの接続エラーが発生

### エラー詳細
- ファイル: `frontend/app/admin/polls/page.tsx`
- 問題箇所: 80行目の`fetchPolls`関数でAPIを呼び出している部分
- エラー内容: APIエンドポイントのポート番号が誤っている

## STEP0. ゴール地点の確認
- 管理画面のPolls一覧が正常に表示されるようにする
- 環境変数の設定に基づいた適切なAPIエンドポイントを使用する
- ハードコードを排除し、保守性の高いコードにする

## STEP1. 不具合発生箇所の調査

### 調査結果
1. **フロントエンドのコード（frontend/app/admin/polls/page.tsx）**
   - 80行目: `const response = await fetch("http://localhost:4000/api/admin/polls");`
   - ポート4000でAPIを呼び出そうとしている

2. **環境変数の設定（frontend/.env.local）**
   - `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
   - 正しいポート5001が設定されている

3. **バックエンドAPI**
   - ポート5001で正常に起動している
   - `/api/admin/polls`エンドポイントは正常に動作

## STEP2. 原因の調査

### 考察した原因
1. **ハードコードされたURL**
   - fetchPolls関数でAPIのURLがハードコードされている
   - 環境変数`NEXT_PUBLIC_API_URL`を使用していない
   - ポート番号が4000と誤っている（正しくは5001）

2. **他の箇所でも同様の問題**
   - handleDelete関数（119行目）でも同じ問題がある
   - `http://localhost:4000/api/admin/polls/${id}`

### 根本原因
環境変数を使用せずにAPIのURLをハードコードしているため、実際のバックエンドのポート（5001）と一致せず、接続エラーが発生している。

## STEP3. 修正案の検討

### 修正方針
1. **環境変数の使用**
   - すべてのAPI呼び出しで`NEXT_PUBLIC_API_URL`環境変数を使用する
   - ハードコードされたURLを排除する

2. **修正対象箇所**
   - fetchPolls関数のfetch URL
   - handleDelete関数のfetch URL

### 具体的な修正内容

#### 1. fetchPolls関数（80行目）
```typescript
// 修正前
const response = await fetch("http://localhost:4000/api/admin/polls");

// 修正後
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls`);
```

#### 2. handleDelete関数（119行目）
```typescript
// 修正前
const response = await fetch(`http://localhost:4000/api/admin/polls/${id}`, {

// 修正後
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls/${id}`, {
```

### 修正による効果
- 環境変数に基づいた正しいAPIエンドポイントを使用
- 開発環境と本番環境で異なるAPIURLを使い分け可能
- コードの保守性が向上

## STEP4. 修正の実装

### 実装内容
1. **frontend/app/admin/polls/page.tsx**
   - 80行目: fetchPolls関数のAPI URLを環境変数を使用するよう修正
   - 119行目: handleDelete関数のAPI URLを環境変数を使用するよう修正

2. **frontend/app/admin/polls/new/page.tsx**
   - 25行目: handleSubmit関数のAPI URLを環境変数を使用するよう修正

### 修正後のコード
```typescript
// 環境変数を使用したAPI呼び出し
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/polls`);
```

## 実装状況
✅ 完了（2025-01-19）

## 修正結果
- すべてのハードコードされたAPI URLを環境変数ベースに変更
- ポート番号の不一致問題を解消（4000 → 5001）
- 管理画面でのAPI接続エラーが解決される見込み