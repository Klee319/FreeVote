# 日本語アクセント投票サイト - インフラストラクチャ構成

## 概要

このドキュメントは、日本語アクセント投票サイトのデータベース・インフラストラクチャ構成について説明します。

## 構成要素

### 1. データベース (PostgreSQL)
- **バージョン**: PostgreSQL 15
- **ポート**: 5432
- **初期データベース**: accent_vote_db
- **初期ユーザー**: accent_user

### 2. キャッシュ (Redis)
- **バージョン**: Redis 7
- **ポート**: 6379
- **用途**: セッション管理、API レスポンスキャッシュ、レート制限

### 3. リバースプロキシ (Nginx)
- **ポート**: 80, 443
- **機能**: ロードバランシング、SSL終端、レート制限、静的ファイル配信

### 4. 監視ツール (オプション)
- **Prometheus**: メトリクス収集
- **Grafana**: 可視化
- **Loki**: ログ収集
- **pgAdmin**: PostgreSQL管理
- **Redis Commander**: Redis管理

## クイックスタート

### 前提条件
- Docker および Docker Compose がインストールされていること
- Windows の場合は WSL2 の使用を推奨

### セットアップ手順

#### 1. 環境変数の設定
```bash
cp .env.example .env
# .env ファイルを編集して必要な値を設定
```

#### 2. インフラストラクチャの起動

**Windows の場合:**
```cmd
scripts\setup.bat
# または開発ツールも含めて起動
scripts\setup.bat --with-dev
```

**Linux/Mac の場合:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
# または開発ツールも含めて起動
./scripts/setup.sh --with-dev
```

### 3. サービスへのアクセス

起動後、以下のURLでサービスにアクセスできます：

- **アプリケーション**: http://localhost
- **pgAdmin** (開発ツール): http://localhost:5050
  - Email: admin@accent-vote.local
  - Password: admin
- **Redis Commander** (開発ツール): http://localhost:8081

## データベース管理

### マイグレーション

```bash
# マイグレーション状態の確認
./scripts/migrate.sh status

# マイグレーションの実行
./scripts/migrate.sh up

# ロールバック
./scripts/migrate.sh rollback

# データベースリセット
./scripts/migrate.sh reset

# テストデータの投入
./scripts/migrate.sh seed
```

### バックアップとリストア

```bash
# バックアップの作成
./scripts/migrate.sh backup

# リストア
./scripts/migrate.sh restore db/backup/backup_20240101_120000.sql.gz
```

## Docker コマンド

### 基本操作

```bash
# サービスの起動
docker-compose up -d

# サービスの停止
docker-compose down

# ログの確認
docker-compose logs -f [service_name]

# サービスの状態確認
docker-compose ps
```

### 個別サービスの操作

```bash
# PostgreSQLに接続
docker exec -it accent_vote_postgres psql -U accent_user -d accent_vote_db

# Redisに接続
docker exec -it accent_vote_redis redis-cli

# コンテナのシェルに入る
docker exec -it [container_name] /bin/sh
```

## 監視

### 監視スタックの起動

```bash
# 監視ツールを含めて起動
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### アクセスURL

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: admin
  - Password: admin

## ディレクトリ構造

```
Vote_site/
├── docker-compose.yml          # メインのDocker Compose設定
├── docker-compose.monitoring.yml # 監視ツール用設定
├── Dockerfile                   # アプリケーション用Dockerfile
├── .env.example                 # 環境変数テンプレート
├── db/
│   ├── init/                   # DB初期化スクリプト
│   │   ├── 01_schema.sql       # スキーマ定義
│   │   ├── 02_triggers.sql     # トリガー定義
│   │   ├── 03_views.sql        # ビュー定義
│   │   ├── 04_initial_data.sql # マスタデータ
│   │   └── 05_test_data.sql    # テストデータ
│   └── backup/                  # バックアップ保存先
├── redis/
│   └── redis.conf              # Redis設定
├── nginx/
│   ├── nginx.conf              # Nginx基本設定
│   └── conf.d/
│       └── default.conf        # サイト設定
├── monitoring/
│   ├── prometheus.yml          # Prometheus設定
│   ├── loki-config.yml         # Loki設定
│   ├── promtail-config.yml    # Promtail設定
│   └── grafana/
│       ├── dashboards/         # Grafanaダッシュボード
│       └── datasources/        # データソース設定
└── scripts/
    ├── setup.sh                # セットアップスクリプト (Linux/Mac)
    ├── setup.bat               # セットアップスクリプト (Windows)
    └── migrate.sh              # マイグレーションスクリプト
```

## トラブルシューティング

### ポート競合エラー
```bash
# 使用中のポートを確認
netstat -an | grep :5432
netstat -an | grep :6379
netstat -an | grep :80

# 別のポートを使用する場合は docker-compose.yml を編集
```

### PostgreSQL接続エラー
```bash
# PostgreSQLの状態確認
docker exec accent_vote_postgres pg_isready

# ログ確認
docker-compose logs postgres
```

### Redis接続エラー
```bash
# Redisの状態確認
docker exec accent_vote_redis redis-cli ping

# ログ確認
docker-compose logs redis
```

### ディスク容量不足
```bash
# Dockerのディスク使用量確認
docker system df

# 不要なデータをクリーンアップ
docker system prune -a
```

## セキュリティ上の注意

1. **本番環境では必ず以下を実施してください：**
   - すべてのデフォルトパスワードを変更
   - SSL/TLS証明書の設定
   - ファイアウォールの適切な設定
   - 定期的なセキュリティアップデート

2. **環境変数の管理：**
   - `.env` ファイルは Git にコミットしない
   - 本番環境では環境変数管理サービスを使用

3. **バックアップ：**
   - 定期的なデータベースバックアップの実施
   - バックアップファイルの安全な保管

## サポート

問題が発生した場合は、以下を確認してください：

1. Docker/Docker Composeが正しくインストールされているか
2. 必要なポートが利用可能か
3. ディスク容量が十分か
4. ログファイルにエラーが出力されていないか

## ライセンス

このプロジェクトのインフラストラクチャ設定は、プロジェクト全体のライセンスに従います。