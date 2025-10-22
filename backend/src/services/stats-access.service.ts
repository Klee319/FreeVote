import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * 詳細統計アクセス権限サービス
 */
export class StatsAccessService {
  /**
   * 詳細統計へのアクセス権限をチェック
   * @param pollId - 投票ID
   * @param userToken - ユーザートークン
   * @param userId - ユーザーID（オプション）
   * @returns アクセス可否
   */
  async canAccessDetailStats(
    pollId: string,
    userToken: string,
    userId?: string
  ): Promise<boolean> {
    // 1. 登録ユーザーは常にアクセス可
    if (userId) {
      return true;
    }

    // 2. DetailStatsAccess存在チェック
    const access = await prisma.detailStatsAccess.findFirst({
      where: {
        pollId,
        userToken,
        expiresAt: { gt: new Date() }, // 有効期限内のみ
      },
    });

    return !!access;
  }

  /**
   * 詳細統計アクセス権限を付与
   * @param pollId - 投票ID
   * @param userToken - ユーザートークン
   * @param grantedBy - 付与者のユーザーID
   * @param expirationDays - 有効期限（日数、デフォルト30日）
   * @returns 作成されたアクセス権限レコード
   */
  async grantAccess(
    pollId: string,
    userToken: string,
    grantedBy: string,
    expirationDays: number = 7
  ) {
    // 投票の存在確認
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    // 有効期限を計算
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // アクセス権限を付与（既存の場合は更新）
    const access = await prisma.detailStatsAccess.upsert({
      where: {
        pollId_userToken: {
          pollId,
          userToken,
        },
      },
      update: {
        expiresAt,
        grantedBy,
        grantedAt: new Date(),
      },
      create: {
        pollId,
        userToken,
        expiresAt,
        grantedBy,
      },
    });

    return access;
  }

  /**
   * アクセス権限の確認
   * @param pollId - 投票ID
   * @param userToken - ユーザートークン
   * @returns アクセス権限情報
   */
  async checkAccess(pollId: string, userToken: string) {
    const access = await prisma.detailStatsAccess.findFirst({
      where: {
        pollId,
        userToken,
      },
    });

    if (!access) {
      return {
        hasAccess: false,
        expiresAt: null,
        isExpired: null,
      };
    }

    const isExpired = access.expiresAt < new Date();

    return {
      hasAccess: !isExpired,
      expiresAt: access.expiresAt,
      isExpired,
      grantedAt: access.grantedAt,
    };
  }

  /**
   * 期限切れのアクセス権限を削除（クリーンアップ）
   * @returns 削除されたレコード数
   */
  async cleanupExpiredAccess() {
    const result = await prisma.detailStatsAccess.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * 投票に紐づくすべてのアクセス権限を取得
   * @param pollId - 投票ID
   * @returns アクセス権限リスト
   */
  async getAccessList(pollId: string) {
    const accessList = await prisma.detailStatsAccess.findMany({
      where: { pollId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });

    return accessList;
  }

  /**
   * アクセス権限を取り消し
   * @param pollId - 投票ID
   * @param userToken - ユーザートークン
   * @returns 削除されたレコード
   */
  async revokeAccess(pollId: string, userToken: string) {
    const deleted = await prisma.detailStatsAccess.deleteMany({
      where: {
        pollId,
        userToken,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('アクセス権限が見つかりません');
    }

    return deleted;
  }
}
