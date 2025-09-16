# みんなの投票 - バックエンドAPI

## 概要
「みんなの投票」プラットフォームのバックエンドAPIサーバーです。
Express + TypeScript + Prisma + PostgreSQLで構築されています。

## 必要要件
- Node.js 18以上
- PostgreSQL 15以上
- npm または yarn

## セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

主な設定項目：
- `DATABASE_URL`: PostgreSQLデータベースの接続URL
- `JWT_SECRET`: JWT署名用の秘密鍵（本番環境では必ず変更してください）
- `PORT`: サーバーのポート番号（デフォルト: 5000）
- `CORS_ORIGIN`: フロントエンドのURL

### 3. データベースのセットアップ

#### Prismaクライアントの生成
```bash
npm run prisma:generate
```

#### マイグレーションの実行
```bash
npm run prisma:migrate
```

#### シードデータの投入
```bash
npm run prisma:seed
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

サーバーは http://localhost:5000 で起動します。

## テストアカウント
シードデータには以下のテストアカウントが含まれています：

- **管理者**
  - Email: admin@example.com
  - Password: admin123

- **一般ユーザー**
  - Email: user1@example.com～user5@example.com
  - Password: user1123～user5123

## 主なAPIエンドポイント

### 認証
- `POST /api/auth/register` - 新規ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - トークンリフレッシュ
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### 投票
- `GET /api/polls` - 投票一覧取得
- `GET /api/polls/:id` - 投票詳細取得
- `POST /api/polls/:id/votes` - 投票する
- `GET /api/polls/:id/stats` - 統計データ取得
- `GET /api/polls/:id/top-by-prefecture` - 都道府県別トップ選択肢

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm run start

# Prismaスタジオ起動（データベース管理GUI）
npm run prisma:studio

# テスト実行
npm test

# リント実行
npm run lint

# フォーマット実行
npm run format
```

## プロジェクト構成

```
backend/
├── src/
│   ├── app.ts                 # Expressアプリケーション設定
│   ├── server.ts               # サーバーエントリポイント
│   ├── config/                 # 設定ファイル
│   │   └── env.ts              # 環境変数設定
│   ├── controllers/            # コントローラー層
│   │   ├── auth.controller.ts  # 認証コントローラー
│   │   └── polls.controller.ts # 投票コントローラー
│   ├── services/               # サービス層
│   │   ├── auth.service.ts     # 認証サービス
│   │   └── polls.service.ts    # 投票サービス
│   ├── routes/                 # ルート定義
│   │   ├── auth.routes.ts      # 認証ルート
│   │   └── polls.routes.ts     # 投票ルート
│   ├── middleware/             # ミドルウェア
│   │   ├── auth.ts             # 認証ミドルウェア
│   │   └── error-handler.ts    # エラーハンドリング
│   └── utils/                  # ユーティリティ
│       ├── errors.ts           # カスタムエラークラス
│       └── validation.ts       # バリデーションスキーマ
├── prisma/
│   ├── schema.prisma           # Prismaスキーマ定義
│   └── seed.ts                 # シードデータスクリプト
├── package.json
├── tsconfig.json
└── .env.example
```

## 技術スタック
- **Node.js 18+** - JavaScriptランタイム
- **Express 4.x** - Webフレームワーク
- **TypeScript 5.x** - 型付きJavaScript
- **Prisma 5.x** - ORM
- **PostgreSQL 15+** - データベース
- **JWT** - 認証トークン
- **Zod** - バリデーション
- **bcrypt** - パスワードハッシュ化

## セキュリティ
- JWT認証（アクセストークン: 15分、リフレッシュトークン: 7日）
- パスワードのbcryptハッシュ化
- レート制限（15分間に100リクエストまで）
- CORS設定
- Helmetによるセキュリティヘッダー設定

## トラブルシューティング

### データベース接続エラー
- PostgreSQLが起動しているか確認
- DATABASE_URLが正しく設定されているか確認
- データベースとユーザーが作成されているか確認

### Prismaエラー
```bash
# Prismaクライアントを再生成
npm run prisma:generate

# スキーマとデータベースを同期
npm run prisma:push
```

### ポートが使用中の場合
.envファイルのPORTを別の番号に変更してください。