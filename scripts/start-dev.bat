@echo off
echo ========================================
echo 日本語アクセント投票サイト - 開発環境起動
echo ========================================
echo.

REM 環境変数の設定
set NODE_ENV=development
set USE_MEMORY_CACHE=true
set USE_MEMORY_DB=true
set DISABLE_RATE_LIMIT=true
set DISABLE_TURNSTILE=true

echo [1/4] 環境変数を設定しました
echo.

REM バックエンドディレクトリに移動
cd /d "%~dp0\..\backend"

echo [2/4] 依存関係をチェック中...
if not exist "node_modules" (
    echo 依存関係をインストール中...
    call npm install
) else (
    echo 依存関係は既にインストール済みです
)
echo.

echo [3/4] Prismaクライアントを生成中...
call npx prisma generate
echo.

echo [4/4] バックエンドサーバーを起動中...
echo サーバーURL: http://localhost:3001
echo.

REM 新しいコマンドプロンプトウィンドウでバックエンドを起動
start "Backend Server" cmd /k "npm run dev"

echo.
echo バックエンドサーバーを起動しました
echo.

REM フロントエンドディレクトリに移動
cd /d "%~dp0\..\accent-vote-site"

echo [フロントエンド] 依存関係をチェック中...
if not exist "node_modules" (
    echo 依存関係をインストール中...
    call npm install
) else (
    echo 依存関係は既にインストール済みです
)
echo.

echo [フロントエンド] 開発サーバーを起動中...
echo アプリケーションURL: http://localhost:3000
echo.

REM 新しいコマンドプロンプトウィンドウでフロントエンドを起動
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo 起動完了！
echo.
echo バックエンド: http://localhost:3001
echo フロントエンド: http://localhost:3000
echo.
echo 両方のサーバーが起動するまでお待ちください。
echo このウィンドウは閉じても構いません。
echo ========================================
echo.
pause