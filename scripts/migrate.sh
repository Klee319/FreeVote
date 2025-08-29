#!/bin/bash

# ======================================
# データベースマイグレーションスクリプト
# ======================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 環境変数の読み込み
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# データベース接続情報
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-accent_vote_db}
DB_USER=${DB_USER:-accent_user}
DB_PASSWORD=${DB_PASSWORD:-accent_password}

# マイグレーションコマンド
MIGRATE_CMD=$1

# ======================================
# マイグレーション関数
# ======================================

# データベース接続テスト
test_connection() {
    log_info "データベース接続をテストしています..."
    docker exec accent_vote_postgres pg_isready -h localhost -U $DB_USER
    if [ $? -eq 0 ]; then
        log_info "✓ データベースに接続できました"
    else
        log_error "データベースに接続できません"
        exit 1
    fi
}

# マイグレーション状態確認
check_status() {
    log_info "現在のマイグレーション状態を確認しています..."
    
    docker exec accent_vote_postgres psql -U $DB_USER -d $DB_NAME -c \
        "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
        | head -20
}

# マイグレーション実行
run_migration() {
    local migration_file=$1
    
    if [ ! -f "$migration_file" ]; then
        log_error "マイグレーションファイルが見つかりません: $migration_file"
        exit 1
    fi
    
    log_info "マイグレーションを実行しています: $migration_file"
    
    docker exec -i accent_vote_postgres psql -U $DB_USER -d $DB_NAME < "$migration_file"
    
    if [ $? -eq 0 ]; then
        log_info "✓ マイグレーションが完了しました"
    else
        log_error "マイグレーションに失敗しました"
        exit 1
    fi
}

# ロールバック
rollback() {
    log_warn "ロールバックを実行しています..."
    
    # ロールバックスクリプトが存在する場合
    if [ -f "db/rollback/rollback_latest.sql" ]; then
        docker exec -i accent_vote_postgres psql -U $DB_USER -d $DB_NAME < "db/rollback/rollback_latest.sql"
        log_info "✓ ロールバックが完了しました"
    else
        log_error "ロールバックスクリプトが見つかりません"
        exit 1
    fi
}

# データベースリセット
reset_database() {
    log_warn "データベースをリセットします。すべてのデータが失われます！"
    read -p "本当に実行しますか？ (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "リセットをキャンセルしました"
        exit 0
    fi
    
    log_info "データベースを削除しています..."
    docker exec accent_vote_postgres psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    log_info "データベースを再作成しています..."
    docker exec accent_vote_postgres psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    log_info "初期スキーマを適用しています..."
    for file in db/init/*.sql; do
        run_migration "$file"
    done
    
    log_info "✓ データベースのリセットが完了しました"
}

# シード実行
seed_database() {
    log_info "シードデータを投入しています..."
    
    if [ -f "db/init/05_test_data.sql" ]; then
        docker exec -i accent_vote_postgres psql -U $DB_USER -d $DB_NAME < "db/init/05_test_data.sql"
        log_info "✓ シードデータの投入が完了しました"
    else
        log_warn "シードデータファイルが見つかりません"
    fi
}

# バックアップ作成
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="db/backup/backup_${timestamp}.sql"
    
    log_info "バックアップを作成しています: $backup_file"
    
    mkdir -p db/backup
    docker exec accent_vote_postgres pg_dump -U $DB_USER -d $DB_NAME > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_info "✓ バックアップが完了しました: $backup_file"
        # 圧縮
        gzip "$backup_file"
        log_info "✓ バックアップを圧縮しました: ${backup_file}.gz"
    else
        log_error "バックアップに失敗しました"
        exit 1
    fi
}

# バックアップからリストア
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "バックアップファイルを指定してください"
        echo "使用方法: ./migrate.sh restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "バックアップファイルが見つかりません: $backup_file"
        exit 1
    fi
    
    log_warn "データベースをリストアします。現在のデータは失われます！"
    read -p "本当に実行しますか？ (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "リストアをキャンセルしました"
        exit 0
    fi
    
    log_info "リストアを実行しています: $backup_file"
    
    # 圧縮ファイルの場合は解凍
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i accent_vote_postgres psql -U $DB_USER -d $DB_NAME
    else
        docker exec -i accent_vote_postgres psql -U $DB_USER -d $DB_NAME < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "✓ リストアが完了しました"
    else
        log_error "リストアに失敗しました"
        exit 1
    fi
}

# ======================================
# メイン処理
# ======================================

case "$MIGRATE_CMD" in
    status)
        test_connection
        check_status
        ;;
    up)
        test_connection
        if [ -n "$2" ]; then
            run_migration "$2"
        else
            log_info "すべてのマイグレーションを実行します..."
            for file in db/migrations/*.sql; do
                if [ -f "$file" ]; then
                    run_migration "$file"
                fi
            done
        fi
        ;;
    down|rollback)
        test_connection
        rollback
        ;;
    reset)
        test_connection
        reset_database
        ;;
    seed)
        test_connection
        seed_database
        ;;
    backup)
        test_connection
        create_backup
        ;;
    restore)
        test_connection
        restore_backup "$2"
        ;;
    help|--help|-h)
        echo "日本語アクセント投票サイト - データベースマイグレーションツール"
        echo ""
        echo "使用方法:"
        echo "  ./migrate.sh <command> [options]"
        echo ""
        echo "コマンド:"
        echo "  status              現在のマイグレーション状態を確認"
        echo "  up [file]           マイグレーションを実行"
        echo "  down|rollback       最後のマイグレーションをロールバック"
        echo "  reset               データベースを完全にリセット"
        echo "  seed                シードデータを投入"
        echo "  backup              データベースのバックアップを作成"
        echo "  restore <file>      バックアップからリストア"
        echo "  help                このヘルプを表示"
        ;;
    *)
        log_error "不明なコマンド: $MIGRATE_CMD"
        echo "使用方法: ./migrate.sh help"
        exit 1
        ;;
esac