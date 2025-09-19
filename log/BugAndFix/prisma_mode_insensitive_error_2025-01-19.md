# Prisma mode: 'insensitive' エラー修正報告書

## 不具合・エラーの概要
日時: 2025-01-19
報告内容: 投票サイトの検索機能でPrismaクエリエラーが発生

### エラー詳細
```
Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
```

### 影響箇所
- backend/src/services/polls.service.ts の96行目と112行目
- titleとdescriptionフィールドでのキーワード検索機能

## STEP0: ゴール地点の確認
- Prismaエラーを解消し、検索機能を正常に動作させる
- SQLiteで大文字小文字を区別しない検索を実現
- データベースプロバイダーに依存しない実装にする
- 根本的な解決を図る

## STEP1: 不具合発生箇所の調査

### 調査結果
エラー発生箇所:
```typescript
// backend/src/services/polls.service.ts 71-72行目
{ title: { contains: search, mode: 'insensitive' } },
{ description: { contains: search, mode: 'insensitive' } },
```

### 発見した事実
- SQLiteデータベースを使用している（schema.prismaで確認）
- Prismaクライアントが`mode`パラメータをSQLiteで認識しない
- 開発環境はSQLiteを使用

## STEP2: 原因の調査

### 考察した原因
1. **SQLiteの制限**
   - SQLiteはPrismaの`mode: 'insensitive'`パラメータをサポートしていない
   - PostgreSQLやMySQLではサポートされているが、SQLiteでは利用不可

2. **Prismaのデータベース依存性**
   - `mode`パラメータは特定のデータベースプロバイダーでのみ使用可能
   - SQLiteではLIKE演算子がデフォルトで大文字小文字を区別しない

3. **実装の不整合**
   - コードがPostgreSQL/MySQL向けに書かれていた可能性
   - SQLiteへの移行時に修正されていない

## STEP3: 修正案の検討

### 修正方針
SQLiteの特性を活かし、`mode`パラメータを削除する方法を採用

### 具体的な修正内容
1. `contains`クエリから`mode: 'insensitive'`パラメータを削除
2. SQLiteのLIKE演算子のデフォルト動作（大文字小文字を区別しない）を利用

### 修正コード
```typescript
// 修正前
{ title: { contains: search, mode: 'insensitive' } },
{ description: { contains: search, mode: 'insensitive' } },

// 修正後
{ title: { contains: search } },
{ description: { contains: search } },
```

## 実際に修正した原因
SQLiteがPrismaの`mode: 'insensitive'`パラメータをサポートしていないため

## 修正内容と修正箇所
- **ファイル**: backend/src/services/polls.service.ts
- **行番号**: 71行目、72行目
- **修正内容**: `mode: 'insensitive'`パラメータを削除
- **理由**: SQLiteではcontainsクエリがデフォルトで大文字小文字を区別しないため、modeパラメータが不要

## 補足情報
### SQLiteでの大文字小文字を区別しない検索について
- SQLiteのLIKE演算子はデフォルトで大文字小文字を区別しない（ASCII文字の場合）
- 日本語などのマルチバイト文字には影響しない
- 必要に応じてCOLLATE NOCASEを使用することも可能

### 将来的な対応
- PostgreSQLやMySQLへ移行する場合は、データベースプロバイダーを判定して条件分岐する実装を検討
- または、環境変数でデータベースタイプを管理し、適切なクエリを選択する仕組みを導入