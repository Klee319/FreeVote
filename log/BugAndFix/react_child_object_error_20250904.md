# React Child Object エラー調査報告書

## エラー内容
```
caught Error: Objects are not valid as a React child (found: object with keys {id, code, name, description, sortOrder}). If you meant to render a collection of children, use an array instead.
```

## エラー発生条件
- まだ投票していない単語に投票すると発生
- スタックトレースからReactのDOM rendering時にエラーが発生

## 原因分析

### 1. 問題の根本原因
**APIレスポンスとフロントエンドの型不一致**

#### バックエンド側の問題箇所
`backend/src/services/vote.service.ts`のgetVoteStatsメソッド（244-264行目）:

```typescript
async getVoteStats(wordId: number) {
  const nationalStats = await this.prisma.wordNationalStats.findMany({
    where: { wordId },
    include: {
      accentType: true,  // ← ここでaccentTypeオブジェクト全体を含めている
    },
    orderBy: { voteCount: 'desc' },
  });

  return {
    national: nationalStats,  // accentTypeがオブジェクトとして含まれる
    byPrefecture: prefectureStats,
  };
}
```

このメソッドは、`accentType`をオブジェクト（`{id, code, name, description, sortOrder}`）として含む統計データを返しています。

#### フロントエンド側の期待値
`accent-vote-site/components/features/accent/AccentVotingSection.tsx`（33行目）:

```typescript
const stat = nationalStats?.find(s => {
  return s.accentType === accentType;  // accentTypeを文字列として比較
});
```

フロントエンドは`accentType`を文字列（例: `'heiban'`）として期待しています。

### 2. エラーが表示される箇所
`accent-vote-site/lib/dataTransformers.ts`のnormalizeAccentStats関数（14行目）:

```typescript
return stats.map(stat => ({
  accentType: stat.accentType,  // オブジェクトをそのまま設定
  count: stat.voteCount || stat.count || 0,
  percentage: ...
}));
```

この関数が、オブジェクトである`stat.accentType`をそのまま返すため、後でReactコンポーネントがこれを直接レンダリングしようとするとエラーになります。

## 修正方針

### 方針1: バックエンドの修正（推奨）
**理由**: データの一貫性を保ち、転送量を削減

1. `backend/src/services/vote.service.ts`のgetVoteStatsメソッドを修正
2. accentTypeオブジェクトのcodeプロパティのみを返すように変更

```typescript
async getVoteStats(wordId: number) {
  const nationalStats = await this.prisma.wordNationalStats.findMany({
    where: { wordId },
    include: {
      accentType: true,
    },
    orderBy: { voteCount: 'desc' },
  });

  return {
    national: nationalStats.map(stat => ({
      accentType: stat.accentType.code,  // codeプロパティのみ抽出
      voteCount: stat.voteCount,
      percentage: stat.percentage,
    })),
    byPrefecture: ..., // 同様の処理
  };
}
```

### 方針2: フロントエンドの修正（一時対応）
**理由**: 迅速な対応が必要な場合

1. `accent-vote-site/lib/dataTransformers.ts`のnormalizeAccentStats関数を修正
2. accentTypeがオブジェクトの場合、codeプロパティを抽出

```typescript
export function normalizeAccentStats(stats: any[]): AccentStat[] {
  if (!stats || !Array.isArray(stats)) return [];
  
  const totalVotes = stats.reduce((sum, stat) => 
    sum + (stat.voteCount || stat.count || 0), 0
  );
  
  return stats.map(stat => ({
    accentType: typeof stat.accentType === 'object' 
      ? stat.accentType.code 
      : stat.accentType,  // オブジェクトの場合codeを抽出
    count: stat.voteCount || stat.count || 0,
    percentage: totalVotes > 0 
      ? ((stat.voteCount || stat.count || 0) / totalVotes) * 100 
      : 0
  }));
}
```

## 類似問題の確認箇所

### 確認が必要な箇所
1. `WordHeader.tsx` - 単語ヘッダーコンポーネント
2. `StatisticsVisualization.tsx` - 統計可視化コンポーネント
3. `RelatedWords.tsx` - 関連語表示コンポーネント
4. `backend/src/controllers/votes.controller.ts` - 投票コントローラー

これらのコンポーネントでも`accentType`を扱っているため、同様の問題が発生していないか確認が必要です。

## 推奨される実装手順

1. **フロントエンドの一時修正を先に実装**（即座の対応）
   - `dataTransformers.ts`を修正して、オブジェクトのcodeプロパティを抽出
   
2. **バックエンドの修正を実装**（恒久対応）
   - `vote.service.ts`のgetVoteStatsメソッドを修正
   - 統計データのレスポンス形式を統一
   
3. **テスト**
   - 新規投票のテスト
   - 既存投票データの表示確認
   - 統計データの表示確認

4. **フロントエンドの一時修正を削除**
   - バックエンドの修正が確実に動作することを確認後、フロントエンドの一時対応コードを削除

## 結論
このエラーは、バックエンドAPIが返すデータ形式とフロントエンドの期待する形式の不一致により発生しています。根本的な修正にはバックエンド側でのデータ形式統一が必要ですが、迅速な対応のためフロントエンド側での一時修正も有効です。