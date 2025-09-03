import { PrismaClient } from '../generated/prisma';
import { VoteRepository } from '../repositories/vote.repository';
import { AppError } from '../utils/errors';
import { createHash } from 'crypto';

export interface VoteData {
  wordId: number;
  accentTypeId: number;
  deviceId?: string;
  userId?: string;
  prefectureCode?: string;
  ageGroup?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class VoteService {
  private voteRepository: VoteRepository;

  constructor(private prisma: PrismaClient) {
    this.voteRepository = new VoteRepository(prisma);
  }

  /**
   * 投票を処理
   */
  async submitVote(data: VoteData) {
    // デバイスIDの処理（既存IDまたは新規生成）
    let deviceId = data.deviceId;
    
    if (deviceId) {
      // 既存のデバイスIDが提供された場合、存在確認または作成
      let device = await this.prisma.device.findUnique({
        where: { id: deviceId },
      });
      
      if (!device) {
        // デバイスが存在しない場合は作成（フィンガープリントにdeviceIdを含める）
        const fingerprint = this.generateFingerprint(
          deviceId + '-' + (data.userAgent || 'unknown-agent'),
          data.ipAddress || 'unknown-ip'
        );
        device = await this.prisma.device.create({
          data: {
            id: deviceId,
            fingerprintHash: fingerprint,
            lastSeenAt: new Date(),
          },
        });
      } else {
        // 最終閲覧日時を更新
        await this.prisma.device.update({
          where: { id: deviceId },
          data: { lastSeenAt: new Date() },
        });
      }
    } else if (data.userAgent && data.ipAddress) {
      // デバイスIDが無い場合は、フィンガープリントから生成
      const fingerprint = this.generateFingerprint(data.userAgent, data.ipAddress);
      const device = await this.getOrCreateDevice(fingerprint);
      deviceId = device.id;
    } else {
      throw new AppError('デバイスIDが必要です', 400);
    }

    // レート制限チェック
    if (data.ipAddress) {
      const canVote = await this.voteRepository.checkRateLimit(
        data.ipAddress,
        'vote',
        60, // 1時間に60票まで
        60  // 60分のウィンドウ
      );

      if (!canVote) {
        throw new AppError('投票の制限に達しました。しばらく待ってからお試しください。', 429);
      }
    }

    // AccentOptionIDとAccentTypeIDを自動判別する機能
    let actualAccentTypeId = data.accentTypeId;
    let wordId = data.wordId;
    
    // まず、AccentTypeとして有効な値か確認（通常1-4）
    const validAccentType = await this.prisma.accentType.findUnique({
      where: { id: data.accentTypeId },
    });
    
    if (!validAccentType) {
      // AccentTypeとして無効な場合、AccentOption IDとして処理を試みる
      const accentOption = await this.prisma.accentOption.findUnique({
        where: { id: data.accentTypeId },
        include: {
          word: true,
          accentType: true,
        },
      });
      
      if (accentOption) {
        // AccentOption IDとして処理
        wordId = accentOption.wordId;
        actualAccentTypeId = accentOption.accentTypeId;
        
        // wordIdの整合性チェック（指定されている場合のみ）
        if (data.wordId && data.wordId !== wordId) {
          throw new AppError(`指定されたアクセントオプション(ID:${data.accentTypeId})は、この語(ID:${data.wordId})には使用できません`, 400);
        }
        
      } else {
        // AccentTypeでもAccentOptionでもない場合はエラー
        throw new AppError(`無効なアクセント型ID: ${data.accentTypeId}`, 400);
      }
    } else {
      // AccentTypeとして処理
    }

    // 語の存在確認
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
      include: {
        accentOptions: {
          where: { accentTypeId: actualAccentTypeId },
        },
      },
    });

    if (!word) {
      throw new AppError('指定された語が見つかりません', 404);
    }

    if (!word.accentOptions.length) {
      throw new AppError(`指定されたアクセント型は選択できません (wordId: ${wordId}, accentTypeId: ${actualAccentTypeId}, 元のリクエスト: ${data.accentTypeId})`, 400);
    }

    // 投票を作成
    const vote = await this.voteRepository.createVote({
      wordId: wordId,
      accentTypeId: actualAccentTypeId,
      deviceId,
      userId: data.userId,
      prefectureCode: data.prefectureCode,
      ageGroup: data.ageGroup,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    // 監査ログを記録
    await this.recordAuditLog({
      userId: data.userId,
      deviceId,
      action: 'vote',
      resourceType: 'vote',
      resourceId: vote.id,
      newData: JSON.stringify({
        wordId: vote.wordId,
        accentTypeId: vote.accentTypeId,
        prefectureCode: vote.prefectureCode,
        ageGroup: vote.ageGroup
      }),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    // 最新の統計データを取得して返す
    console.log(`[VoteService] Getting updated stats for word ${wordId}`);
    const updatedStats = await this.getVoteStats(wordId);
    
    return {
      ...vote,
      stats: updatedStats
    };
  }

  /**
   * 投票を取り消し
   */
  async cancelVote(voteId: number, deviceId: string) {
    // 投票の存在確認
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new AppError('投票が見つかりません', 404);
    }

    if (vote.deviceId !== deviceId) {
      throw new AppError('この投票を取り消す権限がありません', 403);
    }

    // 24時間以内の投票のみ取り消し可能
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    if (vote.createdAt < twentyFourHoursAgo) {
      throw new AppError('投票から24時間以上経過したため、取り消しできません', 400);
    }

    // 投票を削除
    await this.voteRepository.deleteVote(voteId, deviceId);

    // 監査ログを記録
    await this.recordAuditLog({
      userId: vote.userId,
      deviceId,
      action: 'cancel_vote',
      resourceType: 'vote',
      resourceId: voteId,
      oldData: vote,
      ipAddress: null,
      userAgent: null,
    });
  }

  /**
   * ユーザーの投票履歴を取得
   */
  async getUserVoteHistory(
    userId?: string,
    deviceId?: string,
    limit: number = 20,
    offset: number = 0
  ) {
    if (userId) {
      return await this.voteRepository.getUserVotes(userId, limit, offset);
    } else if (deviceId) {
      return await this.voteRepository.getDeviceVotes(deviceId, limit, offset);
    }
    
    throw new AppError('ユーザーIDまたはデバイスIDが必要です', 400);
  }

  /**
   * 特定の語に対するユーザーの投票を取得
   */
  async getUserVoteForWord(wordId: number, deviceId: string) {
    return await this.voteRepository.getRecentVote(wordId, deviceId);
  }

  /**
   * 投票統計を取得
   */
  async getVoteStats(wordId: number) {
    const nationalStats = await this.prisma.wordNationalStats.findMany({
      where: { wordId },
      include: {
        accentType: true,
      },
      orderBy: { voteCount: 'desc' },
    });

    const prefectureStats = await this.prisma.wordPrefStats.findMany({
      where: { wordId },
      include: {
        accentType: true,
        prefecture: true,
      },
      orderBy: { voteCount: 'desc' },
    });

    return {
      national: nationalStats,
      byPrefecture: prefectureStats,
    };
  }

  /**
   * デバイスフィンガープリントを生成
   */
  private generateFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}-${ipAddress}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * デバイスを取得または作成
   */
  private async getOrCreateDevice(fingerprintHash: string) {
    let device = await this.prisma.device.findUnique({
      where: { fingerprintHash },
    });

    if (!device) {
      device = await this.prisma.device.create({
        data: {
          fingerprintHash,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // 最終閲覧日時を更新
      await this.prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });
    }

    return device;
  }

  /**
   * 監査ログを記録
   */
  private async recordAuditLog(data: {
    userId?: string | null;
    deviceId: string;
    action: string;
    resourceType: string;
    resourceId: number;
    oldData?: any;
    newData?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        deviceId: data.deviceId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldData: data.oldData ? data.oldData : undefined,
        newData: data.newData ? data.newData : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}