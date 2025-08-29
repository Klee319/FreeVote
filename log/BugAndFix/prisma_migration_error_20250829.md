# Prismaマイグレーションエラーの修正レポート

## 不具合・エラーの概要
日付: 2025-08-29
種類: Prismaマイグレーションエラー

### エラー内容
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
  -->  prisma\schema.prisma:11
   |
10 |   provider = "postgresql"
11 |   url      = env("DATABASE_URL")
```

## STEP0. ゴール地点の確認
### 目標
- PrismaマイグレーションエラーP1012を解消する
- DATABASE_URLが正しいPostgreSQL接続文字列形式になるよう修正する
- データベース接続が正常に行えるようにする

## STEP1. 不具合発生箇所の調査
### 調査結果
1. **エラー発生箇所**: backend/prisma/schema.prisma の11行目
   - datasource定義でDATABASE_URLを参照している箇所

2. **関連ファイル**:
   - backend/.env (DATABASE_URL設定箇所)
   - backend/prisma/schema.prisma (datasource定義)

3. **問題の特定**:
   - backend/.envファイルのDATABASE_URLが「http://memory」となっている
   - これはPostgreSQLの接続文字列形式ではない

## STEP2. 原因の調査
### 原因分析
1. **直接的な原因**:
   - DATABASE_URL=http://memory (7行目)
   - この値はメモリデータベース用の設定だが、PostgreSQL用の正しい形式ではない

2. **根本原因**:
   - 開発環境でメモリDBを使用する設定になっているが、Prismaのschema.prismaでは provider="postgresql" が指定されている
   - USE_MEMORY_DB=true の設定と、Prismaのpostgresql設定が矛盾している

3. **環境設定の確認**:
   - 正しいPostgreSQL接続文字列がコメントアウトされている（11行目）
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accent_vote_dev?schema=public`

## STEP3. 修正案の検討
### 修正方針
1. **メモリDBを使用する場合の対応**:
   - USE_MEMORY_DB=trueの場合、Prismaマイグレーションは使用できない
   - 開発用のSQLiteまたは実際のPostgreSQLを使用する必要がある

2. **推奨される修正方法**:
   - **オプション1**: PostgreSQLを使用（Dockerやローカルインストール）
   - **オプション2**: SQLiteを使用（開発環境用）

3. **選択した修正方法**: SQLiteを使用（開発環境として簡単に動作確認できるため）

## STEP4. 修正実施
### 実施した修正

1. **backend/.envファイルの修正**:
   - DATABASE_URLを正しいPostgreSQL接続文字列に修正
   - 変更前: `DATABASE_URL=http://memory`
   - 変更後: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accent_vote_dev?schema=public`
   - USE_MEMORY_DBをfalseに設定

2. **注意事項**:
   - PostgreSQLが起動している必要がある（Dockerまたはローカルインストール）
   - データベース「accent_vote_dev」が作成されている必要がある
   - ユーザー「postgres」でパスワード「postgres」でアクセス可能である必要がある

## 修正内容と修正箇所

### 修正ファイル: backend/.env
- 7行目: DATABASE_URLを正しいPostgreSQL接続文字列に変更
- 8行目: USE_MEMORY_DBをfalseに変更

### 修正後の設定
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accent_vote_dev?schema=public
USE_MEMORY_DB=false
```

## 追加の手順

マイグレーションを実行する前に、以下の手順が必要です：

1. **PostgreSQLのセットアップ**:
   ```bash
   # Dockerを使用する場合
   docker run --name postgres-accent-vote \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=accent_vote_dev \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Prismaマイグレーションの実行**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

3. **Prismaクライアントの生成**:
   ```bash
   npx prisma generate
   ```

## 結論
- DATABASE_URLがPostgreSQLの正しい接続文字列形式になった
- P1012エラーは解消される
- PostgreSQLのセットアップが必要