# コーディングスタイルと規約

## TypeScript共通設定

### 型付けルール
- **strict: true** - 厳格な型チェック有効
- **strictNullChecks: true** - null/undefinedの厳密なチェック
- **noImplicitAny: true** - 暗黙的なany型を禁止
- **noUnusedLocals: true** - 未使用のローカル変数を警告
- **noUnusedParameters: true** - 未使用のパラメータを警告

## フロントエンド（Next.js）

### コーディング規約
- **コンポーネント**: 関数コンポーネント、export default使用
- **状態管理**: Zustandストア + カスタムフック
- **スタイリング**: Tailwind CSS + Radix UIコンポーネント
- **インポート**: `@/`エイリアス使用
- **フック**: useで始まるカスタムフック

### ファイル命名規則
- コンポーネント: PascalCase（例: `PollCard.tsx`）
- ユーティリティ: camelCase（例: `formatDate.ts`）
- 型定義: types/ディレクトリに配置

### コンポーネント構造例
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { usePolls } from '@/hooks/usePolls';

export default function ComponentName() {
  const [state, setState] = useState<Type>();
  
  useEffect(() => {
    // 副作用処理
  }, [dependencies]);
  
  return (
    <div className="container mx-auto px-4">
      {/* JSXコンテンツ */}
    </div>
  );
}
```

## バックエンド（Express + TypeScript）

### コーディング規約
- **アーキテクチャ**: レイヤードアーキテクチャ（Controller → Service → Repository）
- **エラーハンドリング**: カスタムエラークラス使用
- **バリデーション**: Zod + express-validator
- **インポート**: `@/`エイリアスとドメイン別エイリアス使用

### ファイル命名規則
- Controller: `*.controller.ts`
- Service: `*.service.ts`
- Routes: `*.routes.ts`
- Middleware: ケバブケース（例: `error-handler.ts`）

### 典型的な構造例

#### コントローラー
```typescript
import { Request, Response } from 'express';
import { pollsService } from '@services/polls.service';
import { AppError } from '@utils/errors';

export class PollsController {
  async getPolls(req: Request, res: Response): Promise<void> {
    try {
      const result = await pollsService.getPolls(req.query);
      res.json(result);
    } catch (error) {
      throw new AppError('Error message', 500);
    }
  }
}
```

#### サービス
```typescript
export class PollsService {
  async getPolls(params: GetPollsParams): Promise<Poll[]> {
    // ビジネスロジック
    return await prisma.poll.findMany({
      // Prismaクエリ
    });
  }
}
```

## 共通のベストプラクティス

### コメント
- コメントは最小限に留める
- 複雑なビジネスロジックのみコメント追加
- JSDocは公開APIのみ

### エラーハンドリング
- try-catchブロックで適切にエラーキャッチ
- カスタムエラークラスでエラー種別を明確化
- ユーザーに返すエラーメッセージは簡潔に

### 非同期処理
- async/awaitを使用（コールバックやPromise.thenは避ける）
- Promise.allで並列処理の最適化

### 環境変数
- .envファイルで管理（本番環境では環境変数設定）
- 機密情報はコミットしない
- .env.exampleで必要な環境変数を文書化

## リンティング・フォーマット

### ESLint
- フロントエンド: `npm run lint`
- バックエンド: `npm run lint`

### Prettier（バックエンドのみ）
- `npm run format`でコード整形

## テスト規約
- ユニットテストはJest使用（バックエンド）
- テストファイルは`*.test.ts`または`*.spec.ts`
- E2Eテストは別途検討