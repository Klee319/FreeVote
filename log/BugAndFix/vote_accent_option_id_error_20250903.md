# 投票機能エラー：AccentOption ID と AccentType ID の混同

## 発生日時
2025-09-03

## エラー内容
```
[API Proxy] Backend response: {
  status: 500,
  data: {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '指定されたアクセントオプション(ID:13)は、この語(ID:4)には使用できません',
    }
  }
}
```

## リクエスト内容
```javascript
bodyContent: {
  wordId: 4,
  accentTypeId: 13,  // 実際はAccentOption ID
  prefecture: '13',
  deviceId: '36f7f458-fbc6-4d40-b3ca-034c96cca951'
}
```

## 原因分析

### 1. データ構造の確認
- **AccentOption ID 13**：Word ID 5（紅葉）に属している、AccentType ID 3（中高型）
- **Word ID 4（東京）**：AccentOption ID 9, 10のみ存在（AccentType ID 1, 2）

### 2. コードの問題箇所

#### フロントエンド
**`accent-vote-site/components/features/accent/AccentVotingSection.tsx`** (96行目)：
```tsx
onVote={() => onVote(option.id)}  // AccentOption IDを送信している
```

**`accent-vote-site/app/words/[id]/page.tsx`** (57-62行目)：
```tsx
return api.submitVote({
  wordId: parseInt(wordId),
  accentTypeId,  // 実際はAccentOption IDが入っている
  prefecture: selectedPrefecture as any,
  deviceId: user.deviceId,
});
```

#### バックエンド
**`backend/src/services/vote.service.ts`** (80-115行目)：
- AccentOption ID から AccentType ID への変換機能は実装済み
- wordId の整合性チェックでエラーを正しく検出している（105-107行目）

### 3. API レスポンス構造
**`backend/src/services/word.service.ts`** の `getWordDetail` メソッド：
```javascript
accentOptions: accentOptions.map(option => ({
  id: option.id,  // AccentOption ID
  accentType: {
    code: option.accentType.code,
    name: option.accentType.name
  },
  // accentTypeId は含まれていない！
  pattern: option.accentPattern,
  dropPosition: option.dropPosition
}))
```

## 修正方針

### 推奨案：WordService のレスポンスに accentTypeId を追加

#### 1. バックエンドの修正
**`backend/src/services/word.service.ts`** の `getWordDetail` メソッド：
```javascript
accentOptions: accentOptions.map(option => ({
  id: option.id,
  accentTypeId: option.accentTypeId,  // 追加
  accentType: {
    code: option.accentType.code,
    name: option.accentType.name
  },
  pattern: option.accentPattern,
  dropPosition: option.dropPosition
}))
```

#### 2. フロントエンドの修正
**`accent-vote-site/components/features/accent/AccentVotingSection.tsx`** (96行目)：
```tsx
// 修正前
onVote={() => onVote(option.id)}

// 修正後
onVote={() => onVote(option.accentTypeId)}
```

#### 3. TypeScript 型定義の更新
**`accent-vote-site/types/index.ts`** の `AccentOption` 型：
```typescript
export interface AccentOption {
  id: number;
  accentTypeId: number;  // 追加
  accentType: {
    code: string;
    name: string;
  };
  pattern: string;
  dropPosition: number | null;
}
```

### 代替案1：パラメーター名を明確化

1. API パラメーターを `accentOptionId` に変更
2. バックエンドで AccentOption ID として処理
3. フロントエンドはそのまま `option.id` を送信

### 代替案2：AccentType コードで処理

1. フロントエンドから AccentType コード（heiban, atamadaka等）を送信
2. バックエンドでコードから AccentType ID を解決

## 影響範囲

1. **WordService.getWordDetail**：レスポンス構造の変更
2. **AccentVotingSection**：投票ボタンのクリックハンドラー
3. **TypeScript 型定義**：AccentOption インターフェース
4. **既存データ**：影響なし（読み取り時に accentTypeId を追加するだけ）

## テストケース

1. Word ID 4（東京）で投票できること
2. Word ID 5（紅葉）で投票できること
3. 不正な AccentType ID でエラーが出ること
4. 投票後、統計が正しく更新されること
5. 24時間以内の重複投票が制限されること

## 実装優先順位

1. **高**：WordService のレスポンス修正（根本対策）
2. **高**：フロントエンドの投票処理修正
3. **中**：TypeScript 型定義の更新
4. **低**：エラーメッセージの改善

## 備考

- バックエンドの VoteService は AccentOption ID を処理する機能を持っているが、wordId の整合性チェックで正しくエラーを出している
- この修正により、API の意図が明確になり、将来的な混乱を避けられる
- 既存のデータには影響なし