# 新規登録時のバリデーションエラー修正報告書

## 不具合・エラーの概要

新規登録時に以下のバリデーションエラーが発生：
- **ageGroup**: `'10s'` が送信されているが、期待値は日本語（`'10代'` など）
- **prefecture**: `'kyoto'` が送信されているが、期待値は日本語（`'京都府'` など）
- **gender**: `'male'` が送信されているが、期待値は日本語（`'男性'` など）

エラー内容：
```
ageGroup: Invalid enum value. Expected '10代' | '20代' | '30代' | '40代' | '50代' | '60代' | '70代以上', received '10s'
prefecture: Invalid enum value. Expected '北海道' | '青森県' | ... | '沖縄県', received 'kyoto'
gender: Invalid enum value. Expected '男性' | '女性' | 'その他', received 'male'
```

## STEP1. 不具合発生箇所の調査

### 調査結果
1. **フロントエンド（frontend/lib/constants.ts）**:
   - セレクトボックスの`value`属性に英語値を設定（例：`'10s'`, `'kyoto'`, `'male'`）
   - 表示用の`label`属性には日本語を設定

2. **フロントエンド（frontend/app/auth/register/page.tsx）**:
   - セレクトボックスから選択された`value`（英語値）をそのままフォームデータとして送信

3. **バックエンド（backend/src/utils/validation.ts）**:
   - zodスキーマで日本語のEnum値のみを受け付ける設定
   - 英語値は想定していない

## STEP2. 原因の調査

### 考察した原因
フロントエンドとバックエンドで値の形式が一致していない：
- **フロントエンド**: 内部処理用に英語値を使用（`'10s'`, `'kyoto'`, `'male'`など）
- **バックエンド**: 日本語値のみを受け付ける（`'10代'`, `'京都府'`, `'男性'`など）

この不一致により、フロントエンドから送信された英語値がバックエンドのバリデーションで拒否される。

### 原因の確実性
確実。コードを確認した結果、明確に値の形式が異なっていることが判明。

## STEP3. 修正案の検討

### 修正方針の選択肢

#### 方針A: フロントエンドで日本語値を送信（推奨）
**メリット**：
- バックエンドの変更が不要
- データベースに日本語で保存されるため、データの可読性が高い
- 他のシステムとの互換性が保たれる

**デメリット**：
- フロントエンドの定数定義を変更する必要がある

#### 方針B: バックエンドで英語値を受け付けて日本語に変換
**メリット**：
- フロントエンドの変更が不要
- APIの柔軟性が増す

**デメリット**：
- バックエンドのバリデーションロジックが複雑になる
- 変換処理の実装が必要
- エラーの原因が分かりにくくなる可能性がある

### 選択した方針
**方針A: フロントエンドで日本語値を送信**を選択

理由：
1. シンプルで分かりやすい実装
2. バックエンドのバリデーションロジックを変更する必要がない
3. データの一貫性が保たれる
4. 既存の実装への影響が最小限

## STEP4. 修正の実施

### 実際に修正した内容

### frontend/lib/constants.ts
```typescript
// 修正前
export const PREFECTURES = [
  { value: 'hokkaido', label: '北海道' },
  { value: 'kyoto', label: '京都府' },
  // ...
];

export const AGE_GROUPS = [
  { value: '10s', label: '10代' },
  { value: '20s', label: '20代' },
  // ...
];

export const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

// 修正後
export const PREFECTURES = [
  { value: '北海道', label: '北海道' },
  { value: '京都府', label: '京都府' },
  // ...
];

export const AGE_GROUPS = [
  { value: '10代', label: '10代' },
  { value: '20代', label: '20代' },
  // ...
];

export const GENDERS = [
  { value: '男性', label: '男性' },
  { value: '女性', label: '女性' },
  { value: 'その他', label: 'その他' },
];
```

### frontend/app/auth/register/page.tsx
```typescript
// 修正前
setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })

// 修正後
setFormData({ ...formData, gender: value as '男性' | '女性' | 'その他' })
```

### frontend/types/index.ts
```typescript
// 修正前
gender: 'male' | 'female' | 'other';

// 修正後（2箇所とも修正）
gender: '男性' | '女性' | 'その他';
```

## 修正完了

すべての修正を実施しました。これにより、フロントエンドから日本語のEnum値が送信され、バックエンドのバリデーションエラーが解消されます。

### 修正箇所まとめ
1. **frontend/lib/constants.ts**: すべての定数の`value`属性を日本語に変更
2. **frontend/types/index.ts**: `gender`の型定義を日本語に変更（2箇所）
3. **frontend/app/auth/register/page.tsx**: デフォルト値と型キャストを日本語に変更