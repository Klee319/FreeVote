#!/bin/bash

# ======================================
# 日本語アクセント投票サイト セットアップスクリプト
# ======================================

set -e  # エラー時に停止

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ======================================
# 環境チェック
# ======================================

check_requirements() {
    log_info "必要なツールをチェックしています..."
    
    # Docker チェック
    if ! command -v docker &> /dev/null; then
        log_error "Docker がインストールされていません"
        exit 1
    fi
    log_info "✓ Docker: $(docker --version)"
    
    # Docker Compose チェック
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose がインストールされていません"
            exit 1
        fi
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    log_info "✓ Docker Compose: $($DOCKER_COMPOSE version)"
    
    # Node.js チェック（オプション）
    if command -v node &> /dev/null; then
        log_info "✓ Node.js: $(node --version)"
    else
        log_warn "Node.js がインストールされていません（アプリケーション開発には必要です）"
    fi
}

# ======================================
# 環境設定
# ======================================

setup_environment() {
    log_info "環境設定を準備しています..."
    
    # .env ファイルの作成
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "✓ .env ファイルを作成しました"
            log_warn "  .env ファイルの設定値を確認してください"
        else
            log_error ".env.example ファイルが見つかりません"
            exit 1
        fi
    else
        log_info "✓ .env ファイルは既に存在します"
    fi
    
    # 必要なディレクトリの作成
    directories=(
        "db/backup"
        "nginx/logs"
        "nginx/ssl"
        "logs"
        "uploads"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "✓ ディレクトリを作成: $dir"
        fi
    done
}

# ======================================
# Docker環境の準備
# ======================================

prepare_docker() {
    log_info "Docker環境を準備しています..."
    
    # 既存のコンテナを停止
    if [ "$($DOCKER_COMPOSE ps -q)" ]; then
        log_warn "既存のコンテナを停止しています..."
        $DOCKER_COMPOSE down
    fi
    
    # Dockerネットワークの作成（既存でなければ）
    if ! docker network ls | grep -q accent_network; then
        docker network create accent_network
        log_info "✓ Docker ネットワークを作成しました"
    fi
    
    # ボリュームのクリーンアップ（オプション）
    if [ "$1" == "--clean" ]; then
        log_warn "Dockerボリュームをクリーンアップしています..."
        docker volume rm vote_site_postgres_data vote_site_redis_data 2>/dev/null || true
    fi
}

# ======================================
# サービスの起動
# ======================================

start_services() {
    log_info "サービスを起動しています..."
    
    # PostgreSQL と Redis を先に起動
    log_info "データベースサービスを起動中..."
    $DOCKER_COMPOSE up -d postgres redis
    
    # PostgreSQL の準備完了を待つ
    log_info "PostgreSQL の準備を待っています..."
    until docker exec accent_vote_postgres pg_isready -U accent_user > /dev/null 2>&1; do
        sleep 2
    done
    log_info "✓ PostgreSQL が準備完了"
    
    # Redis の準備完了を待つ
    log_info "Redis の準備を待っています..."
    until docker exec accent_vote_redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
    done
    log_info "✓ Redis が準備完了"
    
    # 全サービスを起動
    log_info "すべてのサービスを起動中..."
    $DOCKER_COMPOSE up -d
    
    log_info "✓ すべてのサービスが起動しました"
}

# ======================================
# 初期データの投入
# ======================================

load_initial_data() {
    log_info "初期データを投入しています..."
    
    # テストデータのロード
    if [ -f "db/init/05_test_data.sql" ]; then
        log_info "テストデータを投入中..."
        docker exec -i accent_vote_postgres psql -U accent_user -d accent_vote_db < db/init/05_test_data.sql
        log_info "✓ テストデータの投入完了"
    fi
}

# ======================================
# ヘルスチェック
# ======================================

health_check() {
    log_info "サービスのヘルスチェックを実行中..."
    
    services=(
        "postgres:5432"
        "redis:6379"
        # "app:3000"  # アプリケーションが起動後にコメント解除
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        container_name="accent_vote_${name}"
        
        if docker ps | grep -q $container_name; then
            log_info "✓ $name is running"
        else
            log_error "✗ $name is not running"
        fi
    done
}

# ======================================
# 開発ツールの起動（オプション）
# ======================================

start_dev_tools() {
    if [ "$1" == "--with-dev" ]; then
        log_info "開発ツールを起動しています..."
        $DOCKER_COMPOSE --profile dev up -d
        log_info "✓ pgAdmin: http://localhost:5050"
        log_info "✓ Redis Commander: http://localhost:8081"
    fi
}

# ======================================
# メイン処理
# ======================================

main() {
    echo "======================================"
    echo "日本語アクセント投票サイト"
    echo "環境セットアップスクリプト"
    echo "======================================"
    echo ""
    
    # 引数の処理
    CLEAN_FLAG=""
    DEV_FLAG=""
    
    for arg in "$@"; do
        case $arg in
            --clean)
                CLEAN_FLAG="--clean"
                ;;
            --with-dev)
                DEV_FLAG="--with-dev"
                ;;
            --help)
                echo "使用方法: ./setup.sh [オプション]"
                echo ""
                echo "オプション:"
                echo "  --clean     既存のDockerボリュームをクリーンアップ"
                echo "  --with-dev  開発ツール（pgAdmin, Redis Commander）も起動"
                echo "  --help      このヘルプを表示"
                exit 0
                ;;
        esac
    done
    
    # セットアップ実行
    check_requirements
    setup_environment
    prepare_docker $CLEAN_FLAG
    start_services
    sleep 5  # サービスが完全に起動するまで待機
    load_initial_data
    health_check
    start_dev_tools $DEV_FLAG
    
    echo ""
    log_info "======================================"
    log_info "セットアップが完了しました！"
    log_info "======================================"
    log_info ""
    log_info "アクセス URL:"
    log_info "  アプリケーション: http://localhost"
    log_info "  API: http://localhost/api"
    
    if [ "$DEV_FLAG" == "--with-dev" ]; then
        log_info "  pgAdmin: http://localhost:5050"
        log_info "  Redis Commander: http://localhost:8081"
    fi
    
    log_info ""
    log_info "コンテナの状態確認:"
    log_info "  $DOCKER_COMPOSE ps"
    log_info ""
    log_info "ログの確認:"
    log_info "  $DOCKER_COMPOSE logs -f [service_name]"
    log_info ""
    log_info "停止方法:"
    log_info "  $DOCKER_COMPOSE down"
}

# スクリプト実行
main "$@"