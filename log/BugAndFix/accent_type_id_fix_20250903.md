# アクセントタイプID送信エラーの修正

## 発生日時
2025年9月3日

## 問題の概要
投票時に正しいaccent_type IDが送信されず、エラーが発生していた問題。

## エラーの詳細
- フロントエンドから送信される `accentTypeId` が実際の `accent_type` テーブルのIDではなく、`AccentOption` のID（連番）が送信されていた
- 例：東京都（prefecture: '13'）として13が送信され、これがaccentTypeIdと誤認識されていた

## 原因
1. `AccentVotingSection` コンポーネントで `onVote(option.id)` として AccentOption のIDを渡していた
2. AccentOption の型定義に `accentTypeId` プロパティが存在していなかった
3. APIレスポンスでも実際のaccent_type IDが含まれていなかった

## 修正内容

### 1. AccentOption型の更新（types/index.ts）
```typescript
export interface AccentOption {
  id: number;
  accentTypeId?: number; // accent_typeテーブルの実際のID
  accentType: {
    code: AccentType;
    name: string;
  };
  pattern: number[];
  dropPosition?: number;
}
```

### 2. AccentVotingSectionコンポーネントの修正
```typescript
// 変更前
onVote={() => onVote(option.id)}

// 変更後
onVote={() => onVote(option.accentTypeId || option.id)}
```

### 3. API submitVoteメソッドの改善（lib/api.ts）
- レスポンスに統計データを含むように修正
- モック環境でも適切な統計データを返すように改善

### 4. モックデータの更新（data/mockData.ts）
- すべてのAccentOptionに `accentTypeId` を追加
- 頭高型: 1, 平板型: 2, 中高型: 3, 尾高型: 4 として統一

## 影響範囲
- 投票機能全般
- 統計データの更新処理
- モック環境での開発・テスト

## テスト項目
1. 投票時に正しいaccentTypeIdが送信されることを確認
2. 投票後の統計データが正しく更新されることを確認
3. モック環境での動作確認
4. 実際のAPI連携時の動作確認

## 今後の対策
1. APIレスポンスで常に `accentTypeId` を含めるようバックエンドと調整
2. フロントエンドとバックエンドの型定義の整合性を保つためのスキーマ共有
3. E2Eテストの追加による投票フローの自動テスト