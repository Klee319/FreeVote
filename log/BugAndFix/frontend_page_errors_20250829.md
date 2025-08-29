# フロントエンドページエラー修正レポート

生成日時: 2025-08-29
対象プロジェクト: 日本語アクセント投票サイト (accent-vote-site)

## STEP0. ゴール地点の確認

### 提示された問題
1. ホームページ(/)でSyntaxError: Unexpected end of JSON inputエラーが発生
2. /submitページが404エラーになっている

### 目標
1. ホームページがエラーなく正常に表示されること
2. /submitページが正常にアクセス可能になること

## STEP1. 不具合発生箇所の調査

### 1. JSON.parseエラーの調査結果

調査したファイル:
- app/page.tsx - JSON.parse未使用
- components/features/stats/StatisticsSummary.tsx - JSON.parse未使用
- components/features/stats/RankingSection.tsx - JSON.parse未使用
- components/features/stats/RecentWordsSection.tsx - JSON.parse未使用
- components/features/search/SearchSection.tsx - JSON.parse未使用
- lib/api.ts - **JSON.parse使用箇所を2箇所発見**

発見箇所:
```typescript
// lib/api.ts 68行目
const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');

// lib/api.ts 109行目
const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');
```

### 2. /submitページ404エラーの調査結果

ディレクトリ構造:
```
accent-vote-site/app/
├── (auth)/
│   ├── dashboard/
│   └── submit/  ← 空ディレクトリ
├── ranking/
│   └── page.tsx
├── search/
│   └── page.tsx
└── words/
    └── [id]/
        └── page.tsx
```

問題点:
- submitページが`(auth)`ディレクトリ内に配置されているが、page.tsxファイルが存在しない
- `(auth)`はNext.jsのRoute Groupsでありパスに影響しないが、ファイル自体が存在しない

## STEP2. 原因の調査

### 1. JSON.parseエラーの原因

**根本原因**: localStorageへの初回アクセス時の処理に問題がある可能性

考察:
- サーバーサイドレンダリング(SSR)時にlocalStorageにアクセスしようとしている
- api.tsのcanVoteメソッドとsubmitVoteメソッドで`typeof window === 'undefined'`のチェックはあるが、初期レンダリング時に何らかの形でJSON.parseが実行されている可能性

追加調査結果:
- RankingSectionとRecentWordsSectionは'use client'ディレクティブがあり、クライアントコンポーネント
- React QueryのuseQueryフックでデータフェッチしている
- api.tsのメソッドはPromiseを返すが、localStorageアクセスは特定のメソッドのみ

**真の原因**: localStorageから不正な値（空文字列など）を読み込んでJSON.parseに失敗している可能性が高い

### 2. /submitページ404エラーの原因

**根本原因**: submitページのpage.tsxファイルが作成されていない

理由:
- プロジェクト初期実装時に未実装のまま放置された
- (auth)ディレクトリ内に配置する設計だったが、実装が完了していない

## STEP3. 修正案の検討

### 1. JSON.parseエラーの修正方針

**修正方針**: localStorage読み込み時のエラーハンドリング強化

実装内容:
1. JSON.parseをtry-catchで囲む
2. 不正な値の場合はデフォルト値を返す
3. localStorageの初期化処理を追加

### 2. /submitページ404エラーの修正方針

**修正方針**: submitページを適切な場所に実装

選択肢:
1. app/submit/page.tsx として実装（推奨）
2. app/(auth)/submit/page.tsx として実装

推奨理由:
- 認証不要でアクセス可能にすべき（ゲストユーザーも投稿可能）
- (auth)グループは認証が必要なページ用に予約

## 実装計画

### 優先度1: JSON.parseエラーの修正
1. lib/api.tsのlocalStorage処理にエラーハンドリング追加
2. テスト実施

### 優先度2: /submitページの実装
1. app/submit/page.tsx を新規作成
2. 新語投稿フォームコンポーネントの実装
3. APIとの連携実装

## 修正内容と修正箇所

### 1. JSON.parseエラーの修正

**ファイル**: lib/api.ts

修正箇所1（68-73行目付近）:
```typescript
// 修正前
const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');

// 修正後
let voteHistory: any = {};
try {
  const stored = localStorage.getItem('voteHistory');
  voteHistory = stored ? JSON.parse(stored) : {};
} catch (e) {
  console.warn('Failed to parse voteHistory from localStorage', e);
  voteHistory = {};
}
```

修正箇所2（109行目付近）:
```typescript
// 修正前
const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');

// 修正後
let voteHistory: any = {};
try {
  const stored = localStorage.getItem('voteHistory');
  voteHistory = stored ? JSON.parse(stored) : {};
} catch (e) {
  console.warn('Failed to parse voteHistory from localStorage', e);
  voteHistory = {};
}
```

### 2. /submitページの実装

**新規ファイル**: app/submit/page.tsx

基本実装:
```typescript
export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">新語投稿</h1>
      {/* 投稿フォームコンポーネント */}
    </div>
  );
}
```

## 次のアクション

1. lib/api.tsのJSON.parse処理を修正
2. submitページの基本実装を作成
3. 動作確認とテスト実施

## 更新履歴

- 2025-08-29: 初版作成 - JSON.parseエラーと/submitページ404問題の調査と修正方針策定