# 不具合分析レポート

生成日時: 2025-08-29
対象プロジェクト: 日本語アクセント投票サイト

## STEP0. ゴール地点の確認

### 報告された問題
1. 未実装の機能がある
2. ユーザー登録のパネルが透明になっている
3. 画面右上のユーザーアイコンを押してもステータスが確認できない
4. viewport警告（2件）
5. 404エラー - リソースの読み込みに失敗
6. Cookie検証エラー - JSONではなくHTMLが返されている

### 修正目標
1. すべての基本機能が正常に動作すること
2. ユーザー登録パネルが適切に表示されること
3. ユーザーステータスが確認可能になること
4. エラーと警告がすべて解消されること

## STEP1. 不具合発生箇所の調査

### 1. viewport警告
**発生箇所**: `accent-vote-site/app/layout.tsx` 52-56行目
```typescript
viewport: {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
},
```
**問題**: Next.js 14でviewportはmetadata exportではなく、viewport exportとして定義すべき

### 2. Cookie検証エラー
**発生箇所**: `useCookieAuth.tsx` 85-90行目
```typescript
const response = await fetch('/api/auth/verify-cookie', {
  method: 'GET',
  credentials: 'include',
});
const data = await response.json();
```
**問題**: `/api/auth/verify-cookie`エンドポイントが404を返し、HTMLエラーページが返されている

### 3. ユーザー登録パネルの透明度問題
**発生箇所**: `AnonymousRegistrationModal.tsx` 40-53行目
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[500px]">
```
**問題**: DialogContentコンポーネントのスタイリングに背景色の指定が不足している可能性

### 4. ユーザーアイコンのステータス表示機能
**発生箇所**: `Header.tsx` 67-70行目
```typescript
<button className="p-2 hover:bg-gray-100 rounded-full">
  <UserCircleIcon className="w-6 h-6 text-gray-600" />
</button>
```
**問題**: ボタンにクリックイベントハンドラーが実装されていない

## STEP2. 原因の調査

### 1. viewport警告の原因
**根本原因**: Next.js 14の仕様変更への未対応
- Next.js 14では`viewport`を独立したexportとして定義する必要がある
- 現在は`metadata`オブジェクト内に含まれているため警告が発生

### 2. Cookie検証エラーの原因
**根本原因**: APIプロキシ設定の不備
- フロントエンドは`/api/auth/verify-cookie`にリクエストを送信
- Next.jsのAPIルートが未実装、またはバックエンドへのプロキシ設定が不足
- バックエンドは`http://localhost:5000`で動作しているが、接続設定が不完全

### 3. ユーザー登録パネルの透明度問題の原因
**根本原因**: DialogContentコンポーネントの背景スタイルが不適切
- `dialog.tsx`コンポーネントのスタイリングで背景色/透明度の設定に問題がある
- Tailwind CSSのクラスが正しく適用されていない可能性

### 4. ユーザーアイコンのステータス表示機能の原因
**根本原因**: 機能が未実装
- ユーザーメニュードロップダウンの実装が完了していない
- 認証状態の表示ロジックが未実装

## STEP3. 修正案の検討

### 優先度1: APIプロキシ設定（Cookie検証エラーの修正）

**修正方針**: Next.jsのrewritesを使用してバックエンドAPIへのプロキシを設定

`next.config.js`に追加:
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*',
    },
  ];
},
```

### 優先度2: viewport警告の修正

**修正方針**: viewportを独立したexportとして定義

`app/layout.tsx`の修正:
```typescript
// metadataからviewportを削除し、独立したexportとして定義
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};
```

### 優先度3: ユーザー登録パネルの背景修正

**修正方針**: DialogContentに適切な背景色を追加

`components/ui/dialog.tsx`の確認と修正:
```typescript
// 背景色とz-indexを明確に設定
className="... bg-white dark:bg-gray-950 ..."
```

### 優先度4: ユーザーアイコンのメニュー実装

**修正方針**: ドロップダウンメニューとステータス表示を実装

新規コンポーネント作成または既存の修正:
- ユーザー情報の表示
- ログアウトボタン
- 設定へのリンク

## 修正実装計画

### フェーズ1: 緊急修正（エラー解消）
1. Next.js APIプロキシ設定の追加
2. viewport exportの修正

### フェーズ2: UI/UX改善
1. DialogContentの背景色修正
2. ユーザーメニューの実装

### フェーズ3: 機能完成
1. 未実装機能の洗い出し
2. 各機能の実装

## 影響範囲

- **APIプロキシ設定**: すべてのAPI通信に影響（改善効果）
- **viewport修正**: SEOとモバイル表示に影響（改善効果）
- **Dialog背景修正**: すべてのモーダル表示に影響
- **ユーザーメニュー実装**: ヘッダーのUXに影響

## リスク評価

- **低リスク**: viewport修正、Dialog背景修正
- **中リスク**: APIプロキシ設定（設定ミスで全API通信が失敗する可能性）
- **低リスク**: ユーザーメニュー実装（新規機能のため既存機能への影響なし）

## 次のアクション

1. `next.config.js`にAPIプロキシ設定を追加
2. `app/layout.tsx`のviewport設定を修正
3. `components/ui/dialog.tsx`の背景色を確認・修正
4. ユーザーメニューコンポーネントの実装
5. 動作確認とテスト

## 更新履歴

- 2025-08-29: 初版作成 - 包括的な不具合分析と修正方針の策定