# 初回投票時500エラーの原因分析と修正方針

## 不具合・エラーの概要
投票サイトで「既に投票したことがない単語に投票すると500エラーが発生する」という不具合が発生しています。

### エラー情報
1. APIエンドポイント `/api/votes` が500エラーを返す
2. Reactレンダリングエラー: "Objects are not valid as a React child (found: object with keys {id, code, name, description, sortOrder})" - AccentTypeオブジェクトをそのままレンダリングしようとしている
3. 既に投票済みの単語への再投票では問題なし
4. 初回投票時のみエラーが発生

## STEP1. 不具合発生箇所の調査

### 調査した箇所
1. **backend/src/controllers/stats.controller.ts**
   - line 80: `accentType: s.accentType.code` - AccentTypeオブジェクトからcodeのみ抽出している（正常）

2. **backend/src/services/vote.service.ts**
   - line 165-167: 投票後に統計データを取得
   - line 263-266: `getVoteStats()`メソッドで`accentType.code`のみを返している（正常）
   - line 50-75: 統計更新処理

3. **backend/src/services/word.service.ts**
   - line 154: `accentType: stat.accentType.code` - AccentTypeオブジェクトからcodeのみ抽出している（正常）

4. **backend/src/repositories/vote.repository.ts**
   - line 196-226: `updateNationalStats()`メソッド - 初回投票時に新規統計レコードを作成
   - line 217-225: 初回投票時の統計作成処理

### 発見した問題箇所
**backend/src/repositories/vote.repository.ts** の `updateNationalStats()` メソッドでの初回投票時の統計作成処理に問題があります。

## STEP2. 原因の調査

### 考察した原因

1. **初回投票時の統計作成時にAccentTypeのincludeが漏れている**
   - `updateNationalStats()`メソッド（line 217-225）で新規作成時、AccentTypeのリレーションを含めずに作成している
   - その結果、`vote.service.ts`の`getVoteStats()`メソッドで統計を取得する際、AccentTypeが含まれていない

2. **データの整合性の問題**
   - 初回投票時: `WordNationalStats`レコードが存在しない → 新規作成される
   - 作成時にAccentTypeリレーションが適切に含まれていない
   - `getVoteStats()`で取得時に`include: { accentType: true }`しても、データが正しく返されない

### 確認された原因
初回投票時に`WordNationalStats`テーブルに新規レコードを作成する際、トランザクション内で作成されたレコードがincludeされていないため、その後の`getVoteStats()`メソッドでAccentTypeオブジェクトを取得できず、undefinedまたは不完全なデータが返されることが原因です。

## STEP3. 修正案の検討

### 修正方針

1. **VoteRepository.updateNationalStats()メソッドの修正**
   - 新規作成時にAccentTypeのリレーションを確実に含める
   - トランザクション後に完全なデータを取得する

2. **VoteService.getVoteStats()メソッドの修正**
   - 統計データ取得時のエラーハンドリング強化
   - AccentTypeが取得できない場合のフォールバック処理

3. **データの正規化処理の強化**
   - AccentTypeオブジェクトが存在する場合でも、確実にcodeのみを抽出する処理を追加

### 修正要件の確認
- ✅ 解消する可能性が極めて高い: 初回投票時のデータ不整合が根本原因であり、これを修正することで解消される
- ✅ ユーザの求める仕様通りの動作: 初回投票でも正常に動作し、統計データが正しく表示される
- ✅ 修正箇所以外への影響なし: 統計データの作成と取得処理のみの修正
- ✅ 実装可能: Prismaのトランザクション処理とリレーション取得の標準的な修正

## 考察した原因
初回投票時に統計レコードを新規作成する際、AccentTypeのリレーションが正しく含まれていないため、その後のデータ取得時にAccentTypeオブジェクトが不完全な状態で返される。

## 実際に修正した原因
`VoteRepository.updateNationalStats()`メソッドでの初回統計作成時にAccentTypeリレーションが正しく設定されていない問題。

## 修正内容と修正箇所
1. `backend/src/repositories/vote.repository.ts` - updateNationalStats()メソッドの修正
2. `backend/src/services/vote.service.ts` - getVoteStats()メソッドのエラーハンドリング強化