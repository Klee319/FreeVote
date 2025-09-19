# Toast Hook および Critters モジュールエラー修正報告書

## 不具合・エラーの概要

### エラー1: use-toastフック欠落
```
Module not found: Can't resolve '@/hooks/use-toast'
```
- 発生場所: frontend/app/admin/settings/page.tsx:10
- 症状: use-toastフックが存在しないため、モジュールが見つからない

### エラー2: crittersモジュール欠落
```
Error: Cannot find module 'critters'
```
- 発生場所: Next.jsの内部処理
- 症状: crittersモジュールがインストールされていない

## STEP0: ゴール地点の確認
- エラー1の目標: use-toastフックのエラーを解消し、トースト通知機能を正常に動作させる
- エラー2の目標: crittersモジュールのエラーを解消し、Next.jsのビルド処理を正常に動作させる

## STEP1: 不具合発生箇所の調査

### 調査結果
1. frontend/hooks/ディレクトリ内のファイル:
   - useAuth.ts
   - usePolls.ts
   - **use-toast.tsは存在しない**

2. frontend/components/ui/ディレクトリ内のファイル:
   - toast関連のコンポーネントファイルは存在しない

3. package.jsonの依存関係:
   - shadcn/uiのtoast関連パッケージはインストールされていない
   - crittersモジュールはインストールされていない
   - @radix-ui系のパッケージは多数インストール済み

4. use-toastを使用している箇所:
   - frontend/app/admin/settings/page.tsx のみ

## STEP2: 原因の調査

### 考察した原因

#### エラー1: use-toastフック欠落の原因
1. **直接的な原因**: shadcn/uiのtoastコンポーネントが未インストール
   - shadcn/uiのtoastコンポーネントとuse-toastフックがプロジェクトに追加されていない
   - frontend/app/admin/settings/page.tsx で `import { toast } from "@/hooks/use-toast"` を使用しているが、該当ファイルが存在しない

2. **背景**:
   - shadcn/uiのコンポーネントは個別にインストールする必要がある
   - toastコンポーネントは自動的にはインストールされない
   - 他のshadcn/uiコンポーネント（button、input、card等）はインストール済み

#### エラー2: crittersモジュール欠落の原因
1. **直接的な原因**: crittersパッケージが未インストール
   - Next.js 15.5.3の内部処理でcrittersが必要とされている
   - package.jsonにcrittersの依存関係が記載されていない

2. **背景**:
   - crittersは、HTMLに含まれるCSSを最適化するツール
   - Next.jsの特定のバージョンや設定によって必要となる場合がある
   - 通常はNext.jsの依存関係として自動的にインストールされるはずだが、何らかの理由で欠落している

## STEP3: 修正案の検討

### 修正方針

#### エラー1: use-toastフックの修正方針

**方針A: shadcn/uiのtoastコンポーネントをインストール（推奨）**
1. shadcn/uiのtoastコンポーネントを正式にインストール
2. 必要な依存関係も自動的にインストールされる
3. 既存のコードをそのまま使用可能

実行コマンド:
```bash
cd frontend
npx shadcn@latest add toast
```

このコマンドにより以下が自動的に作成される:
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `hooks/use-toast.ts`

**方針B: 独自のtoast実装を作成**
1. カスタムのuse-toastフックを作成
2. トースト表示の独自実装
3. 既存のコードに合わせて調整が必要

#### エラー2: crittersモジュールの修正方針

**方針A: crittersを明示的にインストール（推奨）**
```bash
cd frontend
npm install --save-dev critters
```

**方針B: next.config.tsでcrittersを無効化**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: false
  }
}
```

### 推奨される修正手順

1. **shadcn/ui toastコンポーネントのインストール**
   - 最も簡単で確実な方法
   - shadcn/uiの他のコンポーネントと統一性が保たれる
   - メンテナンス性が高い

2. **crittersモジュールのインストール**
   - Next.jsの期待する依存関係を満たす
   - CSS最適化機能を維持できる

3. **アプリケーションレイアウトへのToaster追加**
   - toastが実際に表示されるようにToasterコンポーネントを追加

### 要件の確認
- ✅ 解消する可能性が極めて高い: shadcn/uiは広く使用されており、信頼性が高い
- ✅ 仕様通りの動作: トースト通知機能が正常に動作する
- ✅ 他への影響なし: 独立したコンポーネントのため、他の機能に影響しない
- ✅ 実装可能: npmコマンドで簡単に実装可能
