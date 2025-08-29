@echo off
REM ======================================
REM 日本語アクセント投票サイト セットアップスクリプト (Windows)
REM ======================================

setlocal enabledelayedexpansion

echo ======================================
echo 日本語アクセント投票サイト
echo 環境セットアップスクリプト (Windows)
echo ======================================
echo.

REM ======================================
REM 環境チェック
REM ======================================

echo [INFO] 必要なツールをチェックしています...

REM Docker チェック
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker がインストールされていません
    echo Docker Desktop をインストールしてください: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do echo [INFO] ✓ Docker: %%i

REM Docker Compose チェック
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE=docker-compose
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        set DOCKER_COMPOSE=docker compose
    ) else (
        echo [ERROR] Docker Compose がインストールされていません
        pause
        exit /b 1
    )
)
echo [INFO] ✓ Docker Compose が利用可能

REM Node.js チェック（オプション）
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo [INFO] ✓ Node.js: %%i
) else (
    echo [WARN] Node.js がインストールされていません（アプリケーション開発には必要です）
)

echo.

REM ======================================
REM 環境設定
REM ======================================

echo [INFO] 環境設定を準備しています...

REM .env ファイルの作成
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [INFO] ✓ .env ファイルを作成しました
        echo [WARN]   .env ファイルの設定値を確認してください
    ) else (
        echo [ERROR] .env.example ファイルが見つかりません
        pause
        exit /b 1
    )
) else (
    echo [INFO] ✓ .env ファイルは既に存在します
)

REM 必要なディレクトリの作成
for %%d in (db\backup nginx\logs nginx\ssl logs uploads) do (
    if not exist %%d (
        mkdir %%d
        echo [INFO] ✓ ディレクトリを作成: %%d
    )
)

echo.

REM ======================================
REM Docker環境の準備
REM ======================================

echo [INFO] Docker環境を準備しています...

REM 既存のコンテナを停止
%DOCKER_COMPOSE% ps -q >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] 既存のコンテナを停止しています...
    %DOCKER_COMPOSE% down >nul 2>&1
)

REM Dockerネットワークの作成
docker network ls | findstr accent_network >nul 2>&1
if %errorlevel% neq 0 (
    docker network create accent_network >nul 2>&1
    echo [INFO] ✓ Docker ネットワークを作成しました
)

REM クリーンオプションの処理
if "%1"=="--clean" (
    echo [WARN] Dockerボリュームをクリーンアップしています...
    docker volume rm vote_site_postgres_data vote_site_redis_data >nul 2>&1
)

echo.

REM ======================================
REM サービスの起動
REM ======================================

echo [INFO] サービスを起動しています...

REM PostgreSQL と Redis を先に起動
echo [INFO] データベースサービスを起動中...
%DOCKER_COMPOSE% up -d postgres redis

REM PostgreSQL の準備完了を待つ
echo [INFO] PostgreSQL の準備を待っています...
:wait_postgres
docker exec accent_vote_postgres pg_isready -U accent_user >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo [INFO] ✓ PostgreSQL が準備完了

REM Redis の準備完了を待つ
echo [INFO] Redis の準備を待っています...
:wait_redis
docker exec accent_vote_redis redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_redis
)
echo [INFO] ✓ Redis が準備完了

REM Nginx を起動（アプリケーションはまだ）
echo [INFO] Nginx を起動中...
%DOCKER_COMPOSE% up -d nginx

echo [INFO] ✓ インフラサービスが起動しました

echo.

REM ======================================
REM 初期データの投入
REM ======================================

if exist "db\init\05_test_data.sql" (
    echo [INFO] テストデータを投入中...
    docker exec -i accent_vote_postgres psql -U accent_user -d accent_vote_db < db\init\05_test_data.sql
    echo [INFO] ✓ テストデータの投入完了
)

echo.

REM ======================================
REM 開発ツールの起動（オプション）
REM ======================================

if "%1"=="--with-dev" (
    echo [INFO] 開発ツールを起動しています...
    %DOCKER_COMPOSE% --profile dev up -d
    echo [INFO] ✓ pgAdmin: http://localhost:5050
    echo [INFO] ✓ Redis Commander: http://localhost:8081
)

if "%2"=="--with-dev" (
    echo [INFO] 開発ツールを起動しています...
    %DOCKER_COMPOSE% --profile dev up -d
    echo [INFO] ✓ pgAdmin: http://localhost:5050
    echo [INFO] ✓ Redis Commander: http://localhost:8081
)

echo.

REM ======================================
REM ヘルスチェック
REM ======================================

echo [INFO] サービスのヘルスチェックを実行中...

docker ps | findstr accent_vote_postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] ✓ PostgreSQL is running
) else (
    echo [ERROR] ✗ PostgreSQL is not running
)

docker ps | findstr accent_vote_redis >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] ✓ Redis is running
) else (
    echo [ERROR] ✗ Redis is not running
)

docker ps | findstr accent_vote_nginx >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] ✓ Nginx is running
) else (
    echo [ERROR] ✗ Nginx is not running
)

echo.
echo ======================================
echo [INFO] セットアップが完了しました！
echo ======================================
echo.
echo [INFO] アクセス URL:
echo [INFO]   アプリケーション: http://localhost
echo [INFO]   API: http://localhost/api

if "%1"=="--with-dev" (
    echo [INFO]   pgAdmin: http://localhost:5050
    echo [INFO]   Redis Commander: http://localhost:8081
)

if "%2"=="--with-dev" (
    echo [INFO]   pgAdmin: http://localhost:5050
    echo [INFO]   Redis Commander: http://localhost:8081
)

echo.
echo [INFO] コンテナの状態確認:
echo [INFO]   %DOCKER_COMPOSE% ps
echo.
echo [INFO] ログの確認:
echo [INFO]   %DOCKER_COMPOSE% logs -f [service_name]
echo.
echo [INFO] 停止方法:
echo [INFO]   %DOCKER_COMPOSE% down
echo.

pause