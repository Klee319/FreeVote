# Next.js ビルドキャッシュエラーの修正手順

## 問題の概要
- `.next/server/app/admin/polls/page.js`ファイルが生成されていない
- 複数のNode.jsプロセスが競合している
- ビルドキャッシュの不整合

## 修正手順

### 1. 現在の開発サーバーを停止
コマンドプロンプトまたはターミナルで `Ctrl + C` を押して開発サーバーを停止してください。

### 2. ビルドキャッシュのクリーンアップ
```bash
cd frontend
npm run clean
```

### 3. 開発サーバーの再起動
```bash
npm run dev
```

### 4. もし問題が継続する場合
以下のコマンドを実行してください：

```bash
# 完全な再起動（既存プロセスの停止とキャッシュクリア）
npm run restart
```

## 追加されたnpmスクリプト

- `npm run clean` - ビルドキャッシュをクリーンアップ
- `npm run clean:dev` - キャッシュをクリアして開発サーバーを起動
- `npm run rebuild` - キャッシュをクリアして本番ビルドを実行
- `npm run restart` - 既存プロセスを停止してから安全に再起動

## Next.js設定の最適化
`next.config.ts`に以下の設定を追加しました：

- ビルドキャッシュの最適化設定
- 開発サーバーのインジケータ設定
- SWCミニファイの有効化

## トラブルシューティング

### ポート3000が既に使用されている場合
```bash
# Windows
netstat -ano | findstr :3000
# 表示されたPIDを使って
taskkill /F /PID [PID番号]

# Mac/Linux
lsof -ti :3000 | xargs kill -9
```

### .nextディレクトリが削除できない場合
1. すべてのNode.jsプロセスを終了
2. VSCodeやエディタを一度閉じる
3. 手動で`.next`フォルダを削除
4. 開発サーバーを再起動

## 推奨される開発フロー
1. 大きな変更を行う前に `npm run clean` を実行
2. ビルドエラーが発生したら `npm run restart` を実行
3. 定期的に不要なNode.jsプロセスをチェック