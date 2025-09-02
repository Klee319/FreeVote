# Cookie認証・セッション管理不具合調査報告書

**日付**: 2025-09-02
**報告者**: Claude Code

## 不具合・エラーの概要

1. **リロードするたびに登録を要求される問題**
   - ユーザー登録後もCookieが正しく保存されていない
   - セッション情報が永続化されていない

2. **右上の登録ボタンが押しても反応しない問題**
   - ヘッダーの登録ボタンのイベントハンドラーが正しく設定されていない可能性

## 考察した原因

### 原因1: Cookie設定の不一致
- **バックエンド側**: `sameSite: 'strict'`に設定
- **問題**: Next.jsのAPIプロキシ経由でのCookie転送時に、`set-cookie`ヘッダーが正しく処理されていない
- **詳細**: 
  - バックエンドは`set-cookie`ヘッダーを送信
  - Next.jsのAPIプロキシがこのヘッダーを転送する際、複数のset-cookieヘッダーがある場合に最初の1つしか転送されない

### 原因2: CORS設定の不完全性
- **バックエンド側**: CORS設定で`allowedHeaders`に`X-CSRF-Token`が含まれていない
- **影響**: CSRFトークンを含むリクエストが正しく処理されない可能性

### 原因3: Cookie parser未設定
- **バックエンド側**: cookie-parserミドルウェアが設定されていない
- **影響**: リクエストからCookieを正しく読み取れない

### 原因4: 登録ボタンの動作不良
- **フロントエンド側**: `UserStatusDisplay`コンポーネントで登録ボタンをクリックしてもモーダルが開かない
- **詳細**: モーダルコンポーネントの初期化時にプロバイダーコンテキストが適切に設定されていない可能性

## 実際に修正した原因

1. **バックエンドにcookie-parserミドルウェアが未設定**
   - リクエストからCookieを正しく読み取れていなかった

2. **CORS設定でX-CSRF-Tokenヘッダーが許可されていない**
   - CSRFトークンを含むリクエストが拒否されていた

3. **Cookie設定のsameSiteが開発環境でstrictになっている**
   - 開発環境ではlaxに設定する必要があった

4. **APIプロキシのSet-Cookieヘッダー転送処理の不備**
   - 複数のSet-Cookieヘッダーがある場合に正しく処理できていなかった

## 修正内容と修正箇所

### 修正1: バックエンドのCORS設定を修正
**ファイル**: `backend/src/app.ts`
- `allowedHeaders`に`X-CSRF-Token`を追加
- cookie-parserミドルウェアを追加

### 修正2: APIプロキシのSet-Cookieヘッダー処理を修正
**ファイル**: 
- `accent-vote-site/app/api/auth/verify-cookie/route.ts`
- `accent-vote-site/app/api/auth/anonymous-register/route.ts`
- 複数のSet-Cookieヘッダーを正しく処理するように修正

### 修正3: Cookie設定の調整
**ファイル**: `backend/src/services/cookie-auth.service.ts`
- 開発環境では`sameSite: 'lax'`に変更
- ドメイン設定を追加

### 修正4: 登録モーダルの表示ロジック修正
**ファイル**: `accent-vote-site/components/features/auth/AnonymousRegistrationModal.tsx`
- プロバイダー内での状態管理を修正

## 修正手順

### STEP3: 修正案の検討
以下の修正を実施：
1. バックエンドのCORS設定とcookie-parserの追加
2. APIプロキシのSet-Cookieヘッダー処理の改善
3. Cookie設定の環境別調整
4. フロントエンド側のモーダル制御改善