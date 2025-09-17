# 認証エラーとReactレンダリングエラーの修正報告書

## 不具合・エラーの概要

### エラー1: Authentication Error
- エラーメッセージ: "Authentication error - token may be expired"
- 発生箇所: `lib\api.ts (45:15)`
- 症状: ログイン試行時に認証エラーが発生し、トークンが期限切れと表示される

### エラー2: React Rendering Error
- エラーメッセージ: "Objects are not valid as a React child (found: object with keys {message, code})"
- 症状: エラーオブジェクトを直接レンダリングしようとしてReactエラーが発生

## 考察した原因

### 1. APIレスポンス形式の不一致
バックエンドとフロントエンドでエラーレスポンスの形式が一致していない：

#### バックエンドのエラーレスポンス形式:
```json
{
  "success": false,
  "error": {
    "message": "エラーメッセージ",
    "code": "ERROR_CODE"
  }
}
```

#### フロントエンドが期待している形式:
- `response.data?.message` を直接探している
- `error` オブジェクト内の `message` を正しく取得できていない

### 2. Reactレンダリングエラーの原因
- `useAuth`フックの`setError`に、オブジェクト形式のエラー（`{message, code}`）が設定される可能性がある
- login/register関数で`response.error`をそのまま返している
- `response.error`がオブジェクトの場合、Reactコンポーネントで直接レンダリングしようとしてエラーが発生

## 実際に修正した原因

1. **フロントエンドのAPIエラー処理の不備**: `api.ts`でバックエンドのエラーレスポンス形式を正しく解析していない
2. **エラーメッセージの型不一致**: エラーがオブジェクトとして渡され、文字列として期待されている箇所でレンダリングエラーが発生

## 修正内容と修正箇所

### 1. frontend/lib/api.ts の修正
- line 91-123: エラーレスポンスの解析ロジックを修正
- バックエンドのエラー形式（`error.message`）を正しく取得するように変更
- エラーレスポンスの型定義を改善

### 2. frontend/hooks/useAuth.ts の修正
- line 47-56, 65-74, 87-96: エラーメッセージが確実に文字列になるように型安全性を確保
- オブジェクトではなく文字列のエラーメッセージを返すように修正

### 3. テストスクリプトの作成
- backend/test-auth-api.js: APIのエラーレスポンス形式を確認するためのテストスクリプトを追加

### 具体的な修正コード

#### frontend/lib/api.ts (line 91-101)
```typescript
// 修正前
return {
  error: axiosError.response?.data?.message ||
         axiosError.response?.data?.error ||
         axiosError.message ||
         'An unexpected error occurred',
  status: 'error',
};

// 修正後
return {
  error: axiosError.response?.data?.error?.message ||  // error.messageを先に確認
         axiosError.response?.data?.message ||
         axiosError.response?.data?.error ||
         axiosError.message ||
         'An unexpected error occurred',
  status: 'error',
};
```

#### frontend/hooks/useAuth.ts (line 53, 71, 93)
```typescript
// 修正前
setError(response.error || 'ログインに失敗しました');

// 修正後
const errorMessage = typeof response.error === 'string'
  ? response.error
  : response.error?.message || 'ログインに失敗しました';
setError(errorMessage);
```

これらの修正により、バックエンドのエラー形式を正しく処理し、Reactコンポーネントで文字列のエラーメッセージを安全にレンダリングできるようになります。