# みんなの投票プラットフォーム - プロジェクト概要

## プロジェクトの目的
「みんなの投票」は、ユーザーが様々なトピックについて投票を作成・参加できるオンライン投票プラットフォームです。

## プロジェクト構成
- **フロントエンド（frontend/）**: Next.js 15 + TypeScript + React 19
- **バックエンド（backend/）**: Express + TypeScript + Prisma + PostgreSQL

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15.5.3 (App Router)
- **言語**: TypeScript 5.x
- **UI**:
  - React 19.1.0
  - Tailwind CSS 4.x
  - Radix UI コンポーネント
  - Lucide React (アイコン)
- **状態管理**: Zustand 5.x
- **フォーム管理**: React Hook Form + Zod バリデーション
- **HTTP通信**: Axios

### バックエンド
- **ランタイム**: Node.js 18+
- **フレームワーク**: Express 4.x
- **言語**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **データベース**: PostgreSQL 15+
- **認証**: JWT (jsonwebtoken)
- **バリデーション**: Zod + express-validator
- **セキュリティ**: Helmet, bcrypt, CORS, rate-limiting

## 主要機能
- ユーザー認証（登録、ログイン、JWT認証）
- 投票の作成・参加
- カテゴリー別投票表示（アクセント、エンタメ、ニュース、雑学）
- ソート機能（急上昇、新着、投票数）
- 都道府県別統計
- ランキング機能
- リアルタイム投票結果表示

## ディレクトリ構造
```
Vote_site/
├── frontend/          # Next.jsフロントエンド
│   ├── app/          # App Routerディレクトリ
│   ├── components/   # UIコンポーネント
│   ├── hooks/        # カスタムフック
│   ├── lib/          # ユーティリティ
│   ├── stores/       # Zustand ストア
│   └── types/        # TypeScript型定義
├── backend/          # Express API サーバー
│   ├── src/
│   │   ├── controllers/  # コントローラー層
│   │   ├── services/     # ビジネスロジック層
│   │   ├── routes/       # ルート定義
│   │   ├── middleware/   # ミドルウェア
│   │   ├── config/       # 設定
│   │   └── utils/        # ユーティリティ
│   └── prisma/           # Prismaスキーマ・マイグレーション
├── db/                   # データベース関連
├── log/                  # ログファイル
└── ref/                  # 参考資料
```

## セキュリティ対策
- JWT認証（アクセストークン: 15分、リフレッシュトークン: 7日）
- パスワードのbcryptハッシュ化
- レート制限（15分間に100リクエストまで）
- CORS設定
- Helmetによるセキュリティヘッダー設定
- 環境変数による機密情報管理