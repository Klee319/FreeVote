# タスク完了時のチェックリスト

## コード実装完了時に必ず実行すること

### 1. フロントエンド（frontend/）

#### 必須チェック項目
```bash
cd frontend

# 1. 型チェック（TypeScript）
npm run build  # ビルドが通ることを確認

# 2. リンティング
npm run lint   # ESLintエラーがないことを確認

# 3. 開発サーバーで動作確認
npm run dev    # http://localhost:3000 で動作確認
```

#### 確認事項
- [ ] TypeScriptの型エラーがない
- [ ] ESLintエラー・警告がない
- [ ] UIが正しく表示される
- [ ] レスポンシブデザインが機能する
- [ ] APIとの通信が正常に動作する

### 2. バックエンド（backend/）

#### 必須チェック項目
```bash
cd backend

# 1. TypeScriptビルド
npm run build  # distディレクトリにビルドされることを確認

# 2. リンティング
npm run lint   # ESLintエラーがないことを確認

# 3. コード整形
npm run format # Prettierでコード整形

# 4. Prisma生成（スキーマ変更時）
npm run prisma:generate

# 5. 開発サーバーで動作確認
npm run dev    # http://localhost:5000 で動作確認

# 6. テスト実行（テストがある場合）
npm test
```

#### 確認事項
- [ ] TypeScriptビルドが成功する
- [ ] ESLintエラー・警告がない
- [ ] コードがフォーマットされている
- [ ] APIエンドポイントが正常に動作する
- [ ] エラーハンドリングが適切
- [ ] 環境変数が正しく設定されている

### 3. データベース関連（Prismaスキーマ変更時）

```bash
cd backend

# 1. マイグレーション作成
npm run prisma:migrate

# 2. Prismaクライアント再生成
npm run prisma:generate

# 3. 必要に応じてシードデータ更新
npm run prisma:seed
```

### 4. Git操作前の確認

#### コミット前チェックリスト
- [ ] 不要なconsole.logやデバッグコードを削除
- [ ] 機密情報（API キー、パスワード等）が含まれていない
- [ ] .envファイルがコミット対象になっていない
- [ ] package-lock.jsonの変更が含まれている（依存関係変更時）
- [ ] 不要なファイルが含まれていない

#### 推奨Gitフロー
```bash
# 1. 変更確認
git status
git diff

# 2. ステージング
git add .

# 3. 再度確認
git status

# 4. コミット（意味のあるメッセージで）
git commit -m "feat: 機能説明" 
# または
git commit -m "fix: バグ修正内容"
# または
git commit -m "refactor: リファクタリング内容"
```

### 5. 統合テスト

両環境を同時起動して統合テスト：
```bash
# ターミナル1
cd frontend && npm run dev

# ターミナル2
cd backend && npm run dev

# ブラウザで http://localhost:3000 にアクセス
# 実装した機能が正常に動作することを確認
```

### 6. エラー時の対処

#### ポート競合
```bash
# Windowsでポート確認
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

#### node_modules関連エラー
```bash
# クリーンインストール
rmdir /s /q node_modules
npm install
```

#### Prismaエラー
```bash
npm run prisma:generate
npm run prisma:push  # 開発時のみ
```

## 重要な注意事項

1. **環境変数**: 本番環境の値は絶対にコミットしない
2. **型安全性**: any型の使用は避ける
3. **エラーハンドリング**: 適切なエラーメッセージとステータスコード
4. **パフォーマンス**: 不要な再レンダリングやAPIコールを避ける
5. **セキュリティ**: SQLインジェクション、XSS、CSRFの対策確認