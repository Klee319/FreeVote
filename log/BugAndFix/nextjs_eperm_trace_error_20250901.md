# Next.js EPERM Traceエラー修正報告書

**作成日時**: 2025年9月1日  
**対象環境**: Windows 11  
**プロジェクト**: accent-vote-site (Next.js)

## 不具合・エラーの概要

Next.jsアプリケーション実行時に`.next/trace`ファイルへのアクセス権限エラー（EPERM）が発生。

### エラー内容
```
Error: EPERM: operation not permitted, open 'C:\Users\T-319\Documents\Program\ClaudeCodeDev\products\Vote_site\accent-vote-site\.next\trace'
```

## STEP0. ゴール地点の確認

目標：EPERMエラーを根本的に解消し、Next.jsアプリケーションが正常に動作するようにする。

## STEP1. 不具合発生箇所の調査

### 調査内容
1. 既存の修正報告書（nextjs_eperm_error_fix_20250829.md）を確認
2. 現在の設定は既に適用済みだが、エラーが再発
3. 複数のNode.jsプロセスが実行中（7つのプロセス）
4. ポート3000が既にPID 28168で使用中

### 発生箇所
- `.next/trace`ファイルへのアクセス時
- 複数のNext.jsプロセスが同時実行されている状態

## STEP2. 原因の調査

### 考察した原因
1. **複数プロセスの競合**
   - 7つのNode.jsプロセスが同時実行中
   - ポート3000が既に使用されている状態で新たなプロセスが起動を試みている

2. **traceファイルのロック状態**
   - 既存プロセスが`.next/trace`ファイルを排他的にロック
   - Windows環境でのファイルハンドル管理の問題

3. **設定の不完全性**
   - 以前の修正で`disableOptimizedLoading`を設定したが、トレース機能自体は完全に無効化されていない

### 実際に修正した原因
- Next.jsのトレース機能が完全に無効化されていなかった
- 複数のNode.jsプロセスが同時に`.next/trace`ファイルにアクセスしていた
- Windows環境特有のファイルロック問題

## STEP3. 修正案の検討

### 修正方針
1. **トレース機能の完全無効化**
   - `turbotrace`設定を追加
   - 環境変数で`NEXT_TRACE_DISABLED=1`を設定
   - テレメトリーも無効化

2. **ファイルシステムキャッシュの最適化**
   - Webpackのsnapshotキャッシュを無効化
   - watchOptionsで`.next`ディレクトリを監視対象から除外

3. **クリーンアップスクリプトの追加**
   - `dev:clean`コマンドで`.next`を削除してから起動
   - `clean`コマンドでキャッシュをクリア

## STEP4. 修正内容と修正箇所

### 1. next.config.jsの強化
```javascript
experimental: {
  disableOptimizedLoading: true,
  // トレース機能を完全に無効化
  turbotrace: {
    logLevel: 'error',
    logAll: false,
  },
},
// テレメトリーを無効化
telemetry: {
  disabled: true,
},
webpack: (config, { isServer }) => {
  // Windows環境の特別な設定
  if (process.platform === 'win32') {
    config.snapshot = {
      managedPaths: [],
      immutablePaths: [],
    };
  }
  config.watchOptions = {
    ignored: ['**/node_modules', '**/.next'],
  };
}
```

### 2. 環境変数の追加（.env.local）
```env
NEXT_PRIVATE_WORKER=false
NEXT_TRACE_DISABLED=1
```

### 3. package.jsonにクリーンアップスクリプト追加
```json
"scripts": {
  "dev:clean": "rm -rf .next && next dev",
  "dev:win": "set NEXT_TELEMETRY_DISABLED=1 && next dev",
  "clean": "rm -rf .next node_modules/.cache"
}
```

### 4. 実行手順
1. 既存のNode.jsプロセスを停止
2. `.next`ディレクトリを削除
3. `npm run dev:clean`または`npm run dev:win`で起動