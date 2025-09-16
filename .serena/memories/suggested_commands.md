# 開発コマンド一覧

## フロントエンド

### 開発サーバー起動
```bash
cd frontend
npm run dev
```
アクセス: http://localhost:3000
管理画面: http://localhost:3000/admin

### ビルド
```bash
cd frontend
npm run build
npm run start
```

### リント・フォーマット
```bash
cd frontend
npm run lint
```

## バックエンド

### 開発サーバー起動
```bash
cd backend
npm run dev
```
APIエンドポイント: http://localhost:3001

### Prisma関連
```bash
cd backend
npx prisma generate    # クライアント生成
npx prisma migrate dev  # マイグレーション実行
npx prisma studio      # GUI管理画面
npx prisma db push     # スキーマ反映（マイグレーション無し）
```

### ビルド・本番起動
```bash
cd backend
npm run build
npm start
```

### テスト・リント
```bash
cd backend
npm test
npm run lint
npm run format
```

## 全体

### 依存関係インストール
```bash
# フロントエンドとバックエンド両方
npm install --prefix frontend && npm install --prefix backend
```

### 同時起動（開発）
```bash
# 別々のターミナルで実行
npm run dev --prefix frontend
npm run dev --prefix backend
```

## Git関連

### ステータス確認
```bash
git status
```

### 変更をステージング
```bash
git add .
```

### コミット
```bash
git commit -m "feat: 管理画面実装完了"
```

## 環境変数設定

### フロントエンド (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### バックエンド (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
ADMIN_EMAILS="admin@example.com"
NODE_ENV="development"
```