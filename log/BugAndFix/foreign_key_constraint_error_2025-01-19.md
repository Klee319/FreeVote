# 外部キー制約違反エラーの修正レポート

## 不具合・エラーの概要
- **発生日時**: 2025-01-19
- **エラー内容**: 投票リクエストの承認時に外部キー制約違反が発生
- **エラーコード**: P2003 (PrismaClientKnownRequestError)
- **エラー箇所**: `backend/src/services/admin.service.ts:477` のprisma.poll.create()

```
Invalid `prisma.poll.create()` invocation
Foreign key constraint violated: `foreign key`
code: 'P2003',
meta: { modelName: 'Poll', field_name: 'foreign key' }
```

## 考察した原因
1. **直接的な原因**:
   - `Poll`モデルの`createdBy`フィールドは`User`テーブルの`id`への外部キー参照
   - 現在のコードでは`createdBy: "admin"`という固定文字列を設定している
   - "admin"というIDのユーザーがデータベースに存在しないため、外部キー制約違反が発生

2. **根本的な問題**:
   - 管理者ユーザーのIDを動的に取得する仕組みが実装されていない
   - システムユーザーという概念が存在しない

## 実際に修正した原因
外部キー制約違反の原因は、`createdBy`フィールドに実在しないユーザーID（"admin"という文字列）を設定していることである。

## 修正内容と修正箇所

### 修正方針
UserVoteRequestにユーザーIDが存在する場合はそのユーザーを、存在しない場合は管理者ユーザーまたはシステムユーザーを使用する。

### 具体的な修正

**ファイル**: `backend/src/services/admin.service.ts`

**修正前**:
```typescript
async approveRequest(id: string, adminComment?: string) {
  // ...省略...
  const poll = await prisma.poll.create({
    data: {
      title: request.title,
      description: request.description,
      isAccentMode: false,
      options: request.options,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      categories: request.categories || JSON.stringify(["ユーザー提案"]),
      createdBy: "admin",  // ← 問題箇所：実在しないユーザーID
    },
  });
  // ...省略...
}
```

**修正後**:
```typescript
async approveRequest(id: string, adminComment?: string) {
  const request = await prisma.userVoteRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new ApiError(404, "提案が見つかりません");
  }

  // 作成者のユーザーIDを決定
  // 1. リクエストにユーザーIDがある場合はそれを使用
  // 2. ない場合は管理者ユーザーを取得または作成
  let creatorUserId = request.userId;

  if (!creatorUserId) {
    // 管理者ユーザーを取得
    let adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      // 管理者ユーザーが存在しない場合は作成
      const bcrypt = require('bcrypt');
      const adminPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          passwordHash: adminPassword,
          ageGroup: '30代',
          prefecture: '東京都',
          gender: 'その他',
          isAdmin: true,
        },
      });
    }

    creatorUserId = adminUser.id;
  }

  // 提案を元に新しい投票を作成
  const poll = await prisma.poll.create({
    data: {
      title: request.title,
      description: request.description,
      isAccentMode: false,
      options: request.options,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      categories: request.categories || JSON.stringify(["ユーザー提案"]),
      createdBy: creatorUserId,  // ← 修正：実在するユーザーIDを使用
    },
  });
  // ...省略...
}
```

### 修正のポイント
1. **UserVoteRequestのuserIdを優先的に使用**: 提案したユーザーが存在する場合はそのユーザーを作成者とする
2. **管理者ユーザーの動的取得**: userIdがnullの場合、既存の管理者ユーザーを検索
3. **管理者ユーザーの自動作成**: 管理者ユーザーが存在しない場合は自動的に作成
4. **実在するユーザーIDの保証**: 必ず実在するユーザーIDを`createdBy`に設定することで外部キー制約違反を回避

### 今後の改善提案
1. システムユーザーという専用のユーザーアカウントを作成し、システム側で自動生成される投票に使用することを検討
2. 管理者認証システムの実装により、実際の管理者ユーザーのIDを使用できるようにする
3. データベース初期化時（seed実行時）に必要なシステムアカウントが確実に作成されるようにする