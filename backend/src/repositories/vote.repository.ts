import { PrismaClient, Vote, Prisma } from '../generated/prisma';
import { AppError } from '../utils/errors';

export class VoteRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 投票を作成
   */
  async createVote(data: {
    wordId: number;
    accentTypeId: number;
    deviceId: string;
    userId?: string;
    prefectureCode?: string;
    ageGroup?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Vote> {
    try {
      // トランザクション内で投票と統計の更新を行う
      const result = await this.prisma.$transaction(async (tx) => {
        // 既存の投票を確認
        const existingVote = await tx.vote.findUnique({
          where: {
            deviceId_wordId: {
              deviceId: data.deviceId,
              wordId: data.wordId,
            },
          },
        });

        if (existingVote) {
          throw new AppError('既にこの語に投票済みです', 409);
        }

        // 投票を作成
        const vote = await tx.vote.create({
          data,
          include: {
            word: true,
            accentType: true,
            device: true,
            user: true,
            prefecture: true,
          },
        });

        console.log(`[VoteRepository] Created vote for word ${data.wordId}, accent ${data.accentTypeId}`);

        // 全国統計を更新
        await this.updateNationalStats(tx, data.wordId, data.accentTypeId);
        console.log(`[VoteRepository] Updated national stats for word ${data.wordId}`);

        // 都道府県統計を更新（都道府県コードがある場合）
        if (data.prefectureCode) {
          await this.updatePrefectureStats(
            tx,
            data.wordId,
            data.accentTypeId,
            data.prefectureCode
          );
        }

        return vote;
      }, {
        // トランザクションのタイムアウトとリトライ設定
        maxWait: 5000, // 5秒
        timeout: 10000, // 10秒
        // SQLiteでは分離レベルの設定は不要
      });

      return result;
    } catch (error) {
      // Prismaエラーのハンドリング
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: 一意制約違反（重複投票）
        if (error.code === 'P2002') {
          console.log('[VoteRepository] Duplicate vote attempt detected:', {
            deviceId: data.deviceId,
            wordId: data.wordId,
            error: error.message
          });
          throw new AppError('既にこの語に投票済みです', 409);
        }
        // P2003: 外部キー制約違反
        if (error.code === 'P2003') {
          console.error('[VoteRepository] Foreign key constraint failed:', error);
          throw new AppError('無効なデータが指定されました', 400);
        }
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('[VoteRepository.createVote] Unexpected error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        data
      });
      
      throw new AppError(
        `投票の作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, 
        500
      );
    }
  }

  /**
   * ユーザーの投票履歴を取得
   */
  async getUserVotes(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Vote[]> {
    return await this.prisma.vote.findMany({
      where: { userId },
      include: {
        word: true,
        accentType: true,
        prefecture: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * デバイスの投票履歴を取得
   */
  async getDeviceVotes(
    deviceId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Vote[]> {
    return await this.prisma.vote.findMany({
      where: { deviceId },
      include: {
        word: true,
        accentType: true,
        prefecture: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * 特定の語に対する最新の投票を取得
   */
  async getRecentVote(
    wordId: number,
    deviceId: string
  ): Promise<Vote | null> {
    return await this.prisma.vote.findUnique({
      where: {
        deviceId_wordId: {
          deviceId,
          wordId,
        },
      },
      include: {
        accentType: true,
      },
    });
  }

  /**
   * 投票を削除（取り消し）
   */
  async deleteVote(voteId: number, deviceId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 投票を確認
        const vote = await tx.vote.findUnique({
          where: { id: voteId },
        });

        if (!vote) {
          throw new AppError('投票が見つかりません', 404);
        }

        if (vote.deviceId !== deviceId) {
          throw new AppError('この投票を取り消す権限がありません', 403);
        }

        // 投票を削除
        await tx.vote.delete({
          where: { id: voteId },
        });

        // 全国統計を更新
        await this.updateNationalStats(tx, vote.wordId, vote.accentTypeId, -1);

        // 都道府県統計を更新（都道府県コードがある場合）
        if (vote.prefectureCode) {
          await this.updatePrefectureStats(
            tx,
            vote.wordId,
            vote.accentTypeId,
            vote.prefectureCode,
            -1
          );
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('投票の削除に失敗しました', 500);
    }
  }

  /**
   * 全国統計を更新
   */
  private async updateNationalStats(
    tx: Prisma.TransactionClient,
    wordId: number,
    accentTypeId: number,
    increment: number = 1
  ): Promise<void> {
    try {
      // AccentTypeの存在確認（初回投票時のエラーを防ぐため）
      const accentType = await tx.accentType.findUnique({
        where: { id: accentTypeId }
      });
      
      if (!accentType) {
        console.error(`[VoteRepository] AccentType not found: ${accentTypeId}`);
        throw new AppError(`無効なアクセント型ID: ${accentTypeId}`, 400);
      }

      // 既存の統計を取得または作成（AccentTypeリレーションを含める）
      const existingStats = await tx.wordNationalStats.findUnique({
        where: {
          wordId_accentTypeId: {
            wordId,
            accentTypeId,
          },
        },
        include: {
          accentType: true,
        },
      });

      if (existingStats) {
        // 更新（AccentTypeリレーションを含めて返す）
        const updated = await tx.wordNationalStats.update({
          where: { id: existingStats.id },
          data: {
            voteCount: Math.max(0, existingStats.voteCount + increment), // 負の値を防ぐ
            totalVotes: Math.max(0, existingStats.totalVotes + increment),
          },
          include: {
            accentType: true,
          },
        });
        console.log(`[VoteRepository] Updated national stats: wordId=${wordId}, accentTypeId=${accentTypeId}, voteCount=${updated.voteCount}, totalVotes=${updated.totalVotes}, accentType=${updated.accentType?.code}`);
      } else if (increment > 0) {
        // 新規作成（削除時は作成しない）- AccentTypeリレーションを確実に含める
        const created = await tx.wordNationalStats.create({
          data: {
            word: { connect: { id: wordId } },
            accentType: { connect: { id: accentTypeId } },
            voteCount: increment,
            totalVotes: increment,
            votePercentage: 100, // 初回は100%
          },
          include: {
            accentType: true,
          },
        });
        console.log(`[VoteRepository] Created national stats: wordId=${wordId}, accentTypeId=${accentTypeId}, voteCount=${created.voteCount}, totalVotes=${created.totalVotes}, accentType=${created.accentType?.code}`);
        
        // 作成後の確認
        if (!created.accentType) {
          console.error('[VoteRepository] Warning: AccentType relation not loaded after creation');
        }
      }

      // パーセンテージを再計算
      await this.recalculateNationalPercentages(tx, wordId);
    } catch (error) {
      console.error('[VoteRepository.updateNationalStats] Error:', {
        wordId,
        accentTypeId,
        increment,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * 都道府県統計を更新
   */
  private async updatePrefectureStats(
    tx: Prisma.TransactionClient,
    wordId: number,
    accentTypeId: number,
    prefectureCode: string,
    increment: number = 1
  ): Promise<void> {
    try {
      // Prefectureの存在確認
      const prefecture = await tx.prefecture.findUnique({
        where: { code: prefectureCode }
      });
      
      if (!prefecture) {
        console.error(`[VoteRepository] Prefecture not found: ${prefectureCode}`);
        // 都道府県が見つからない場合はスキップ（エラーにしない）
        return;
      }

      // 既存の統計を取得または作成（AccentTypeリレーションを含める）
      const existingStats = await tx.wordPrefStats.findUnique({
        where: {
          wordId_prefectureCode_accentTypeId: {
            wordId,
            prefectureCode,
            accentTypeId,
          },
        },
        include: {
          accentType: true,
          prefecture: true,
        },
      });

      if (existingStats) {
        // 更新（AccentTypeとPrefectureリレーションを含めて返す）
        const updated = await tx.wordPrefStats.update({
          where: { id: existingStats.id },
          data: {
            voteCount: Math.max(0, existingStats.voteCount + increment),
            totalVotesInPref: Math.max(0, existingStats.totalVotesInPref + increment),
          },
          include: {
            accentType: true,
            prefecture: true,
          },
        });
        console.log(`[VoteRepository] Updated prefecture stats: wordId=${wordId}, prefecture=${prefectureCode}, accentTypeId=${accentTypeId}, voteCount=${updated.voteCount}`);
      } else if (increment > 0) {
        // 新規作成（削除時は作成しない）- AccentTypeとPrefectureリレーションを確実に含める
        const created = await tx.wordPrefStats.create({
          data: {
            word: { connect: { id: wordId } },
            prefecture: { connect: { code: prefectureCode } },
            accentType: { connect: { id: accentTypeId } },
            voteCount: increment,
            totalVotesInPref: increment,
            votePercentage: 100, // 初回は100%
          },
          include: {
            accentType: true,
            prefecture: true,
          },
        });
        console.log(`[VoteRepository] Created prefecture stats: wordId=${wordId}, prefecture=${prefectureCode}, accentTypeId=${accentTypeId}, voteCount=${created.voteCount}`);
      }

      // パーセンテージを再計算
      await this.recalculatePrefecturePercentages(tx, wordId, prefectureCode);
    } catch (error) {
      console.error('[VoteRepository.updatePrefectureStats] Error:', {
        wordId,
        accentTypeId,
        prefectureCode,
        increment,
        error: error instanceof Error ? error.message : error
      });
      // 都道府県統計の更新エラーは投票自体を失敗させない
      // ログを出力して処理を続行
    }
  }

  /**
   * 全国統計のパーセンテージを再計算
   */
  private async recalculateNationalPercentages(
    tx: Prisma.TransactionClient,
    wordId: number
  ): Promise<void> {
    const stats = await tx.wordNationalStats.findMany({
      where: { wordId },
    });

    const totalVotes = stats.reduce((sum, s) => sum + s.voteCount, 0);

    for (const stat of stats) {
      const percentage = totalVotes > 0 ? (stat.voteCount / totalVotes) * 100 : 0;
      await tx.wordNationalStats.update({
        where: { id: stat.id },
        data: {
          votePercentage: percentage,
          totalVotes,
        },
      });
    }
  }

  /**
   * 都道府県統計のパーセンテージを再計算
   */
  private async recalculatePrefecturePercentages(
    tx: Prisma.TransactionClient,
    wordId: number,
    prefectureCode: string
  ): Promise<void> {
    const stats = await tx.wordPrefStats.findMany({
      where: { wordId, prefectureCode },
    });

    const totalVotes = stats.reduce((sum, s) => sum + s.voteCount, 0);

    for (const stat of stats) {
      const percentage = totalVotes > 0 ? (stat.voteCount / totalVotes) * 100 : 0;
      await tx.wordPrefStats.update({
        where: { id: stat.id },
        data: {
          votePercentage: percentage,
          totalVotesInPref: totalVotes,
        },
      });
    }
  }

  /**
   * レート制限チェック
   */
  async checkRateLimit(
    ipAddress: string,
    actionType: string = 'vote',
    limit: number = 60,
    windowMinutes: number = 60
  ): Promise<boolean> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const count = await this.prisma.rateLimit.count({
      where: {
        ipAddress,
        actionType,
        windowStart: {
          gte: windowStart,
        },
      },
    });

    if (count >= limit) {
      return false;
    }

    // レート制限記録を追加
    await this.prisma.rateLimit.create({
      data: {
        ipAddress,
        actionType,
        windowStart: new Date(),
      },
    });

    return true;
  }
}