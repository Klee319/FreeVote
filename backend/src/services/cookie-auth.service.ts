import { PrismaClient, AnonymousUser } from '../generated/prisma';
import { randomUUID } from 'crypto';
import { CookieEncryptionService } from './cookie-encryption.service';
import { AppError } from '../utils/errors';

/**
 * Cookie構造の型定義
 */
export interface AccentVoteCookie {
  deviceId: string;        // UUIDv4
  age: string;            // 年齢層
  gender: string;         // 性別
  prefecture: string;     // 都道府県コード
  registeredAt: number;   // 登録タイムスタンプ
  lastActiveAt: number;   // 最終アクセス
}

/**
 * 匿名ユーザー登録データ
 */
export interface AnonymousUserData {
  age: '10s' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  prefecture: string; // 都道府県コード（2文字）
}

/**
 * Cookie設定オプション
 */
export const COOKIE_OPTIONS = {
  name: 'accent_vote_user',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30日
  path: '/',
};

/**
 * Cookie認証サービス
 * JWT認証を廃止し、Cookie基盤の匿名認証システムを提供
 */
export class CookieAuthService {
  private cookieEncryption: CookieEncryptionService;

  constructor(private prisma: PrismaClient) {
    this.cookieEncryption = new CookieEncryptionService();
  }

  /**
   * 匿名ユーザーを登録
   * @param userData ユーザー属性データ
   * @returns デバイスIDと暗号化されたCookie
   */
  async registerAnonymousUser(userData: AnonymousUserData): Promise<{ 
    deviceId: string; 
    cookie: string;
    user: AnonymousUser;
  }> {
    try {
      // デバイスIDを生成
      const deviceId = randomUUID();
      
      // 匿名ユーザーをデータベースに登録
      const anonymousUser = await this.prisma.anonymousUser.create({
        data: {
          deviceId,
          ageGroup: userData.age,
          gender: userData.gender,
          prefectureCode: userData.prefecture,
          registeredAt: new Date(),
          lastActiveAt: new Date(),
          sessionData: '{}',
        },
        include: {
          prefecture: true,
        },
      });

      // Cookieデータを作成
      const cookieData: AccentVoteCookie = {
        deviceId,
        age: userData.age,
        gender: userData.gender,
        prefecture: userData.prefecture,
        registeredAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      // Cookieデータを暗号化
      const encryptedCookie = await this.cookieEncryption.encrypt(cookieData);
      
      return { 
        deviceId, 
        cookie: encryptedCookie,
        user: anonymousUser,
      };
    } catch (error) {
      throw new AppError(`Failed to register anonymous user: ${error.message}`, 500);
    }
  }

  /**
   * Cookieを検証して匿名ユーザー情報を取得
   * @param cookieValue 暗号化されたCookie値
   * @returns 匿名ユーザー情報またはnull
   */
  async verifyCookie(cookieValue: string): Promise<AnonymousUser | null> {
    try {
      // Cookieを復号化
      const decryptedData = await this.cookieEncryption.decrypt(cookieValue) as AccentVoteCookie;
      
      // 有効期限チェック（30日）
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - decryptedData.registeredAt > thirtyDaysInMs) {
        return null; // Cookie期限切れ
      }

      // データベースでユーザー存在確認
      const user = await this.prisma.anonymousUser.findUnique({
        where: { deviceId: decryptedData.deviceId },
        include: {
          prefecture: true,
        },
      });

      if (user) {
        // 最終アクセス時間を更新
        await this.prisma.anonymousUser.update({
          where: { deviceId: decryptedData.deviceId },
          data: { lastActiveAt: new Date() },
        });
      }

      return user;
    } catch (error) {
      // 復号化エラーまたはその他のエラーの場合はnullを返す
      console.error('Cookie verification failed:', error);
      return null;
    }
  }

  /**
   * セッションをリフレッシュ（最終アクセス時間の更新）
   * @param deviceId デバイスID
   * @returns 更新されたCookie
   */
  async refreshSession(deviceId: string): Promise<{ 
    cookie: string;
    user: AnonymousUser;
  }> {
    try {
      // ユーザー情報を取得
      const user = await this.prisma.anonymousUser.findUnique({
        where: { deviceId },
        include: {
          prefecture: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // 最終アクセス時間を更新
      const updatedUser = await this.prisma.anonymousUser.update({
        where: { deviceId },
        data: { lastActiveAt: new Date() },
        include: {
          prefecture: true,
        },
      });

      // 新しいCookieデータを作成
      const cookieData: AccentVoteCookie = {
        deviceId: user.deviceId,
        age: user.ageGroup,
        gender: user.gender,
        prefecture: user.prefectureCode,
        registeredAt: user.registeredAt.getTime(),
        lastActiveAt: Date.now(),
      };

      // Cookieを暗号化
      const encryptedCookie = await this.cookieEncryption.encrypt(cookieData);

      return {
        cookie: encryptedCookie,
        user: updatedUser,
      };
    } catch (error) {
      throw new AppError(`Failed to refresh session: ${error.message}`, 500);
    }
  }

  /**
   * 匿名ユーザー情報を取得
   * @param deviceId デバイスID
   * @returns 匿名ユーザー情報
   */
  async getAnonymousUser(deviceId: string): Promise<AnonymousUser | null> {
    try {
      const user = await this.prisma.anonymousUser.findUnique({
        where: { deviceId },
        include: {
          prefecture: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Failed to get anonymous user:', error);
      return null;
    }
  }

  /**
   * 匿名ユーザーの属性を更新
   * @param deviceId デバイスID
   * @param updateData 更新データ
   * @returns 更新されたユーザー情報とCookie
   */
  async updateAnonymousUser(
    deviceId: string,
    updateData: Partial<AnonymousUserData>
  ): Promise<{
    user: AnonymousUser;
    cookie: string;
  }> {
    try {
      // ユーザーを更新
      const updatedUser = await this.prisma.anonymousUser.update({
        where: { deviceId },
        data: {
          ageGroup: updateData.age,
          gender: updateData.gender,
          prefectureCode: updateData.prefecture,
          lastActiveAt: new Date(),
        },
        include: {
          prefecture: true,
        },
      });

      // 新しいCookieを生成
      const cookieData: AccentVoteCookie = {
        deviceId: updatedUser.deviceId,
        age: updatedUser.ageGroup,
        gender: updatedUser.gender,
        prefecture: updatedUser.prefectureCode,
        registeredAt: updatedUser.registeredAt.getTime(),
        lastActiveAt: Date.now(),
      };

      const encryptedCookie = await this.cookieEncryption.encrypt(cookieData);

      return {
        user: updatedUser,
        cookie: encryptedCookie,
      };
    } catch (error) {
      throw new AppError(`Failed to update anonymous user: ${error.message}`, 500);
    }
  }

  /**
   * デバイスフィンガープリントを生成
   * @param userAgent ユーザーエージェント
   * @param acceptLanguage 受け入れ言語
   * @param acceptEncoding エンコーディング
   * @returns フィンガープリントハッシュ
   */
  generateDeviceFingerprint(
    userAgent: string,
    acceptLanguage: string,
    acceptEncoding: string
  ): string {
    const crypto = require('crypto');
    const components = [
      userAgent || '',
      acceptLanguage || '',
      acceptEncoding || '',
    ];
    
    const entropy = components.join('|');
    return crypto.createHash('sha256').update(entropy).digest('hex');
  }

  /**
   * 古い匿名ユーザーデータをクリーンアップ
   * @param daysOld 何日以上古いデータを削除するか
   * @returns 削除されたレコード数
   */
  async cleanupOldAnonymousUsers(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.anonymousUser.deleteMany({
        where: {
          lastActiveAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old anonymous users:', error);
      return 0;
    }
  }
}