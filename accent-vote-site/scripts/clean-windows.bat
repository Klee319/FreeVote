@echo off
REM Windows用クリーンアップバッチファイル
REM .nextディレクトリを強制的に削除

echo Windows環境用クリーンアップを開始...

REM Node.jsプロセスを終了
echo Node.jsプロセスを停止中...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM .nextディレクトリの削除
if exist ".next" (
    echo .nextディレクトリを削除中...
    
    REM 読み取り専用属性を解除
    attrib -r -h -s .next\*.* /s /d >nul 2>&1
    
    REM ディレクトリを強制削除
    rmdir /s /q .next >nul 2>&1
    
    if exist ".next" (
        echo 削除に失敗しました。再試行中...
        REM 代替方法で削除を試行
        rd /s /q .next >nul 2>&1
        
        if exist ".next" (
            echo エラー: .nextディレクトリの削除に失敗しました
            echo 手動での削除が必要です
        ) else (
            echo .nextディレクトリを削除しました
        )
    ) else (
        echo .nextディレクトリを削除しました
    )
) else (
    echo .nextディレクトリは存在しません
)

REM node_modules/.cacheディレクトリの削除
if exist "node_modules\.cache" (
    echo node_modules/.cacheディレクトリを削除中...
    rmdir /s /q node_modules\.cache >nul 2>&1
    echo node_modules/.cacheディレクトリを削除しました
) else (
    echo node_modules/.cacheディレクトリは存在しません
)

echo クリーンアップ完了！
pause