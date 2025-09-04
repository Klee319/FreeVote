# Runtime TypeError: toFixed undefined エラー分析レポート

## エラー概要
- **発生日時**: 2025年9月4日
- **エラー内容**: `Cannot read properties of undefined (reading 'toFixed')`
- **発生場所**: StatisticsVisualizationコンポーネント内
- **影響範囲**: WordDetailPageからStatisticsVisualizationへのデータ渡し

## 原因分析

### 1. エラー発生箇所の特定
StatisticsVisualizationコンポーネントで`toFixed`メソッドが呼ばれている箇所：
- 103行目: `stat.percentage.toFixed(1)`
- 115行目: `stat.percentage.toFixed(1)`
- 172行目: `voteStat.percentage.toFixed(1)`
- 184行目: `voteStat.percentage.toFixed(1)`
- 242行目: `voteStat.percentage.toFixed(1)`

### 2. データフローの問題点

#### 2.1 モックデータと実際のAPIレスポンスの不一致
モックデータ（mockData.ts）では`percentage`プロパティが数値として定義されているが、実際のAPIレスポンスまたは投票後の更新処理でデータ構造が異なる可能性がある。

#### 2.2 投票後のデータ更新処理の問題
WordDetailPage.tsx（73-83行目）の投票成功後のデータ更新処理で、APIレスポンスの`stats`構造が期待と異なる：
```typescript
nationalStats: response.stats.national || oldData.nationalStats,
```

ここで`response.stats.national`のデータ構造が`AccentStat[]`型と一致しない可能性がある：
- APIが`voteCount`を返している可能性（106行目で参照）
- `percentage`プロパティが含まれていない可能性

#### 2.3 generateMockPrefectureStats関数の問題
mockData.tsの128-130行目で、percentage計算が行われているが：
```typescript
percentage: (Math.max(0, votes) / totalVotes) * 100,
```
totalVotesが0の場合、`NaN`や`Infinity`になる可能性がある。

### 3. 根本原因
1. **APIレスポンスの不整合**: 投票APIのレスポンスで返される統計データの形式がフロントエンドの型定義と一致していない
2. **データ変換の欠如**: APIレスポンスを受け取った後、適切なデータ変換が行われていない
3. **エラーハンドリング不足**: percentageプロパティが存在しない場合の処理がない

## 修正方針

### 1. 即座の対処（防御的プログラミング）
StatisticsVisualizationコンポーネントにnullチェックとデフォルト値を追加：

```typescript
// StatisticsVisualization.tsx

// 全国統計表示部分（103行目、115行目）
{stat.count}票 ({(stat.percentage || 0).toFixed(1)}%)

// 都道府県別統計表示部分（172行目、184行目、242行目）
{voteStat.count}票 ({(voteStat.percentage || 0).toFixed(1)}%)
```

### 2. データ整合性の確保
WordDetailPageでのデータ更新処理を改善：

```typescript
// WordDetailPage.tsx（73-83行目を修正）
queryClient.setQueryData(['wordDetail', wordId], (oldData: any) => {
  if (!oldData) return oldData;
  
  // APIレスポンスのデータを適切に変換
  const nationalStats = response.stats.national?.map((stat: any) => ({
    accentType: stat.accentType,
    count: stat.voteCount || stat.count || 0,
    percentage: stat.percentage ?? 
      ((stat.voteCount || stat.count || 0) / 
       response.stats.national.reduce((sum: number, s: any) => 
         sum + (s.voteCount || s.count || 0), 0) * 100) || 0
  })) || oldData.nationalStats;
  
  return {
    ...oldData,
    nationalStats,
    totalVotes: nationalStats.reduce(
      (sum: number, stat: any) => sum + stat.count, 
      0
    ) || oldData.totalVotes
  };
});
```

### 3. 型安全性の向上
APIレスポンス専用の型定義を追加：

```typescript
// types/api.ts（新規作成）
export interface VoteResponseStats {
  national: Array<{
    accentType: AccentType;
    voteCount: number;
    percentage?: number;
  }>;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  stats?: VoteResponseStats;
}
```

### 4. バックエンドAPIの修正（推奨）
バックエンドAPIで一貫したレスポンス形式を返すように修正：
- `count`と`voteCount`の統一
- `percentage`の必須化と適切な計算

### 5. データ変換ユーティリティの作成

```typescript
// lib/dataTransformers.ts（新規作成）
export function normalizeAccentStats(stats: any[]): AccentStat[] {
  if (!stats || !Array.isArray(stats)) return [];
  
  const totalVotes = stats.reduce((sum, stat) => 
    sum + (stat.voteCount || stat.count || 0), 0
  );
  
  return stats.map(stat => ({
    accentType: stat.accentType,
    count: stat.voteCount || stat.count || 0,
    percentage: totalVotes > 0 
      ? ((stat.voteCount || stat.count || 0) / totalVotes) * 100 
      : 0
  }));
}

export function normalizePrefectureStats(stats: any[]): PrefectureStat[] {
  if (!stats || !Array.isArray(stats)) return [];
  
  return stats.map(stat => {
    const totalVotes = stat.totalVotes || 0;
    const distribution: Record<AccentType, VoteStat> = {};
    
    Object.entries(stat.accentDistribution || {}).forEach(([type, voteStat]: [string, any]) => {
      distribution[type as AccentType] = {
        count: voteStat.count || 0,
        percentage: totalVotes > 0 
          ? ((voteStat.count || 0) / totalVotes) * 100 
          : 0
      };
    });
    
    return {
      prefectureCode: stat.prefectureCode,
      prefectureName: stat.prefectureName,
      totalVotes,
      dominantAccent: stat.dominantAccent,
      accentDistribution: distribution
    };
  });
}
```

## 実装優先順位

1. **最優先**: 防御的プログラミング（即座の対処）- エラーを防ぐ
2. **高優先**: データ変換ユーティリティの実装 - データ整合性を確保
3. **中優先**: WordDetailPageのデータ更新処理改善 - 根本的な修正
4. **低優先**: バックエンドAPIの修正 - 長期的な解決策

## テストポイント

1. 投票数が0の場合の表示
2. 投票直後のデータ更新
3. 都道府県データが存在しない場合
4. ページ再読み込み時のデータ取得
5. モックデータとAPIデータの切り替わり

## 結論
このエラーは、APIレスポンスとフロントエンドの型定義の不一致、およびデータ変換処理の欠如が原因である。即座の対処として防御的プログラミングを実装し、その後データ変換ユーティリティを導入することで、堅牢性を高めることができる。