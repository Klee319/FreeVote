# 開発用コマンド一覧

## フロントエンド開発（frontend/）

### 基本コマンド
```bash
cd frontend
npm run dev       # 開発サーバー起動（http://localhost:3000）
npm run build     # 本番ビルド
npm run start     # 本番サーバー起動
npm run lint      # ESLintでコードチェック
```

## バックエンド開発（backend/）

### 基本コマンド
```bash
cd backend
npm run dev       # 開発サーバー起動（http://localhost:5000）
npm run build     # TypeScriptビルド
npm run start     # 本番サーバー起動
npm run lint      # ESLintでコードチェック
npm run format    # Prettierでコード整形
npm test          # テスト実行
```

### Prisma関連コマンド
```bash
npm run prisma:generate   # Prismaクライアント生成
npm run prisma:migrate    # マイグレーション実行
npm run prisma:push       # スキーマをDBに反映
npm run prisma:seed       # シードデータ投入
npm run prisma:studio     # Prisma Studio起動（データベース管理GUI）
```

## Windows環境での基本コマンド

### ファイル操作
```bash
dir               # ファイル一覧表示（lsの代わり）
type file.txt     # ファイル内容表示（catの代わり）
copy src dest     # ファイルコピー（cpの代わり）
move src dest     # ファイル移動（mvの代わり）
del file          # ファイル削除（rmの代わり）
mkdir folder      # フォルダ作成
rmdir folder      # フォルダ削除
```

### Git操作
```bash
git status        # 変更状況確認
git add .         # 全ファイルをステージング
git commit -m ""  # コミット
git push          # リモートにプッシュ
git pull          # リモートから取得
git log           # コミット履歴表示
```

### プロセス管理
```bash
tasklist          # 実行中のプロセス一覧（psの代わり）
taskkill /PID <pid>  # プロセス終了（killの代わり）
```

### ネットワーク確認
```bash
netstat -an       # ポート使用状況確認
ipconfig          # ネットワーク設定表示（ifconfigの代わり）
```

## 両環境同時起動スクリプト例
フロントエンドとバックエンドを同時に起動する場合：
```bash
# PowerShellで2つのターミナルを開く
Start-Process powershell -ArgumentList "cd frontend; npm run dev"
Start-Process powershell -ArgumentList "cd backend; npm run dev"
```

## トラブルシューティング

### ポートが使用中の場合
```bash
# Windows: ポート3000を使用しているプロセスを確認
netstat -ano | findstr :3000
# プロセスを終了
taskkill /F /PID <process_id>
```

### node_modulesの再インストール
```bash
# フロントエンド
cd frontend
rmdir /s /q node_modules
npm install

# バックエンド
cd backend
rmdir /s /q node_modules
npm install
```