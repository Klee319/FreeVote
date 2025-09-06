// Prisma クライアントのモック実装（実際のデータベース接続なし）

interface PrismaClient {
  poll: any;
  pollOption: any;
  pollVote: any;
  accentWord: any;
  accentVote: any;
  user: any;
  $disconnect: () => Promise<void>;
}

// モックPrismaクライアント
class MockPrismaClient implements PrismaClient {
  poll = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
  };

  pollOption = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
  };

  pollVote = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
    count: async () => 0,
  };

  accentWord = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
  };

  accentVote = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
    count: async () => 0,
  };

  user = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 1, ...data }),
    update: async (data: any) => data,
    delete: async () => null,
  };

  async $disconnect() {
    // モック実装のため何もしない
  }
}

// シングルトンインスタンス
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new MockPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new MockPrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
export { prisma };

// グローバル型定義
declare global {
  var prisma: PrismaClient | undefined;
}