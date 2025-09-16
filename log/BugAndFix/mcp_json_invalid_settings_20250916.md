# MCP設定ファイル「invalid settings files」エラー修正報告

## 不具合・エラーの概要
.mcp.jsonファイルが「invalid settings files」として認識され、MCP (Model Context Protocol)サーバーが正しく起動しない問題が発生。

## 考察した原因
1. **SQLiteデータベースファイルの不在**
   - 設定で指定されている `backend/prisma/dev.db` ファイルが存在しない
   - backendディレクトリ自体がプロジェクトから削除されている

2. **mcp-sqliteコマンドの未インストール**
   - SQLiteサーバーを起動するための `mcp-sqlite` コマンドがシステムにインストールされていない
   - npm経由でのグローバルインストールも確認されない

3. **プロジェクト構造の変更**
   - git statusから、プロジェクトの大規模なリストラクチャリングが行われたことが判明
   - backendとaccent-vote-siteディレクトリが削除され、Archiveディレクトリに移動された可能性

## 実際に修正した原因
存在しないリソースへの参照が原因で設定ファイルが無効となっていた：
- 存在しないSQLiteデータベースファイルへのパス
- インストールされていないmcp-sqliteコマンドの参照

## 修正内容と修正箇所

### 1. .mcp.jsonファイルの修正
**修正前:**
```json
{
  "mcpServers": {
    "playwright": {...},
    "sqlite": {
      "command": "mcp-sqlite",
      "args": ["C:\\Users\\T-319\\Documents\\Program\\ClaudeCodeDev\\products\\Vote_site\\backend\\prisma\\dev.db"],
      "env": {"NODE_ENV": "development"}
    },
    "serena": {...}
  }
}
```

**修正後:**
```json
{
  "mcpServers": {
    "playwright": {...},
    "serena": {...}
  }
}
```
- 存在しないSQLiteサーバー設定を削除

### 2. .claude/settings.local.jsonファイルの修正
**修正前:**
```json
"enabledMcpjsonServers": ["playwright", "sqlite", "serena"]
```

**修正後:**
```json
"enabledMcpjsonServers": ["playwright", "serena"]
```
- enabledMcpjsonServersリストからsqliteを削除

## 今後の推奨事項
1. SQLiteデータベースが必要な場合は、適切なパスに配置してから設定を追加する
2. mcp-sqliteを使用する場合は、事前に以下のコマンドでインストールする：
   ```bash
   npm install -g @modelcontextprotocol/server-sqlite
   ```
3. プロジェクト構造の変更時は、MCP設定ファイルも同期して更新する