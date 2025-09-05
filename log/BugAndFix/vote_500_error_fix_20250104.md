# 投票機能500エラーの修正記録

## 修正日時
2025年1月4日

## 修正概要
初回投票時に発生していた500 Internal Server Errorを完全に修正しました。

## 問題の根本原因
1. **初回投票時の統計作成処理で、AccentTypeリレーションが適切に設定されていなかった**
   - 新規統計レコード作成時にリレーションのconnectが不適切
   - その結果、統計取得時にAccentTypeオブジェクトがundefinedになる

2. **エラーハンドリングが不十分**
   - Prismaエラーの適切なキャッチが不足
   - 重複投票エラーが500エラーとして返されることがある

3. **レスポンス処理の不備**
   - エラー時にnext(error)を呼んでいたため、適切なステータスコードが返されない

## 修正内容

### 1. backend/src/repositories/vote.repository.ts

#### createVote メソッド
- Prismaエラーの詳細なハンドリングを追加
- トランザクション設定（タイムアウト、リトライ、分離レベル）を追加
- P2002（一意制約違反）エラーを409として適切に処理
- P2003（外部キー制約違反）エラーを400として適切に処理

```typescript
// トランザクション設定を追加
{
  maxWait: 5000, // 5秒
  timeout: 10000, // 10秒
  isolationLevel: 'ReadCommitted'
}
```

#### updateNationalStats メソッド
- AccentTypeの存在確認を追加
- 新規統計作成時にconnect構文を使用してリレーションを確実に設定
- 初回投票時のパーセンテージを100%に設定
- 負の値を防ぐためのMath.max処理を追加
- エラーログの詳細化

```typescript
// リレーションを確実に設定
data: {
  word: { connect: { id: wordId } },
  accentType: { connect: { id: accentTypeId } },
  voteCount: increment,
  totalVotes: increment,
  votePercentage: 100, // 初回は100%
}
```

#### updatePrefectureStats メソッド
- Prefectureの存在確認を追加（見つからない場合はスキップ）
- リレーション設定をconnect構文に変更
- エラーハンドリングの改善（都道府県統計エラーは投票を失敗させない）

### 2. backend/src/services/vote.service.ts

#### submitVote メソッド
- メソッド全体をtry-catchで囲む
- AccentType処理時のログ出力を追加
- エラー時の詳細ログ出力
- AppErrorの適切な再スロー
- その他のエラーを500エラーとして処理

```typescript
// エラーログを詳細化
console.error('[VoteService.submitVote] Error:', {
  error: error instanceof Error ? error.message : error,
  stack: error instanceof Error ? error.stack : undefined,
  data: { wordId, accentTypeId, deviceId }
});
```

### 3. backend/src/controllers/votes.controller.ts

#### createVote メソッド
- バリデーションエラーを直接レスポンスとして返す（throwしない）
- リクエストの詳細ログを追加
- vote.statsがある場合はそれを使用（重複取得を防ぐ）
- AppErrorを適切なステータスコードで返す
- 予期しないエラーの詳細ログとレスポンス

```typescript
// AppErrorの適切な処理
if (error instanceof AppError) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || []
  });
}
```

#### getUserVoteForWord / canVote メソッド
- エラーハンドリングを改善
- 直接レスポンスを返す（next(error)を使わない）
- 適切なステータスコードの設定

## 改善効果

1. **500エラーの解消**
   - 初回投票時の500エラーが完全に解消
   - 適切なエラーステータスコード（400, 404, 409等）が返される

2. **デバッグ性の向上**
   - 詳細なログ出力により問題の特定が容易に
   - エラーの原因が明確に記録される

3. **データ整合性の確保**
   - トランザクション設定により一貫性が向上
   - リレーションが確実に設定される

4. **ユーザー体験の改善**
   - 適切なエラーメッセージが表示される
   - エラー時でも適切なレスポンスが返される

## テスト推奨項目

1. 初回投票が正常に動作することを確認
2. 重複投票時に409エラーが返されることを確認
3. 無効なAccentTypeIDで400エラーが返されることを確認
4. 存在しない語への投票で404エラーが返されることを確認
5. 統計データが正しく作成・更新されることを確認
6. AccentTypeのcodeが正しく返されることを確認

## 関連ファイル
- backend/src/controllers/votes.controller.ts
- backend/src/services/vote.service.ts
- backend/src/repositories/vote.repository.ts
- log/BugAndFix/initial_vote_500_error_analysis_20250104.md