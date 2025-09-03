# Windows用クリーンアップスクリプト
# .nextディレクトリを強制的に削除

$nextDir = ".\.next"
$cacheDir = ".\node_modules\.cache"

Write-Host "Windows環境用クリーンアップを開始..." -ForegroundColor Yellow

# Node.jsプロセスを停止
Write-Host "Node.jsプロセスを停止中..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# .nextディレクトリの削除
if (Test-Path $nextDir) {
    Write-Host ".nextディレクトリを削除中..." -ForegroundColor Cyan
    
    # ファイルの読み取り専用属性を解除
    Get-ChildItem -Path $nextDir -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Attributes -band [System.IO.FileAttributes]::ReadOnly) {
            $_.Attributes = $_.Attributes -bxor [System.IO.FileAttributes]::ReadOnly
        }
    }
    
    # 強制削除を試行
    try {
        Remove-Item -Path $nextDir -Recurse -Force -ErrorAction Stop
        Write-Host ".nextディレクトリを削除しました" -ForegroundColor Green
    } catch {
        Write-Host "通常の削除に失敗。cmd経由で削除を試行..." -ForegroundColor Yellow
        cmd /c "rmdir /s /q $nextDir" 2>$null
        
        if (Test-Path $nextDir) {
            Write-Host "削除に失敗しました。手動での削除が必要です。" -ForegroundColor Red
        } else {
            Write-Host ".nextディレクトリを削除しました" -ForegroundColor Green
        }
    }
} else {
    Write-Host ".nextディレクトリは存在しません" -ForegroundColor Gray
}

# node_modules/.cacheディレクトリの削除
if (Test-Path $cacheDir) {
    Write-Host "node_modules/.cacheディレクトリを削除中..." -ForegroundColor Cyan
    Remove-Item -Path $cacheDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "node_modules/.cacheディレクトリを削除しました" -ForegroundColor Green
} else {
    Write-Host "node_modules/.cacheディレクトリは存在しません" -ForegroundColor Gray
}

Write-Host "クリーンアップ完了！" -ForegroundColor Green