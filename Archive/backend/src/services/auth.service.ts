import { PrismaClient, User } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  prefectureCode?: string;
  ageGroup?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * ユーザー登録
   */
  async register(data: RegisterData): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // メールアドレスの重複チェック
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('このメールアドレスは既に登録されています', 409);
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // ユーザーを作成
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        prefectureCode: data.prefectureCode,
        ageGroup: data.ageGroup,
        role: 'user',
      },
      include: {
        prefecture: true,
      },
    });

    // パスワードを別テーブルに保存（Prismaスキーマに追加が必要）
    // TODO: パスワードテーブルの追加

    // トークンを生成
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * ログイン
   */
  async login(data: LoginData): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // ユーザーを取得
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        prefecture: true,
      },
    });

    if (!user) {
      throw new AppError('メールアドレスまたはパスワードが正しくありません', 401);
    }

    // TODO: パスワードの検証（パスワードテーブルから取得して比較）
    // const isPasswordValid = await bcrypt.compare(data.password, user.password);
    // if (!isPasswordValid) {
    //   throw new AppError('メールアドレスまたはパスワードが正しくありません', 401);
    // }

    // トークンを生成
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * トークンをリフレッシュ
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // リフレッシュトークンを検証
      const payload = jwt.verify(refreshToken, config.JWT_SECRET) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new AppError('無効なトークンです', 401);
      }

      // ユーザーを取得
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        throw new AppError('ユーザーが見つかりません', 404);
      }

      // 新しいトークンを生成
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('トークンの有効期限が切れています', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('無効なトークンです', 401);
      }
      throw error;
    }
  }

  /**
   * ユーザー情報を取得
   */
  async getMe(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        prefecture: true,
      },
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    return user;
  }

  /**
   * プロフィールを更新
   */
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      prefectureCode?: string;
      ageGroup?: string;
    }
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        prefecture: true,
      },
    });

    return user;
  }

  /**
   * パスワードを変更
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // TODO: 現在のパスワードを検証
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    // });

    // const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    // if (!isPasswordValid) {
    //   throw new AppError('現在のパスワードが正しくありません', 401);
    // }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // TODO: パスワードを更新
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { password: hashedPassword },
    // });
  }

  /**
   * アクセストークンを検証
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

      if (payload.type !== 'access') {
        throw new AppError('無効なトークンです', 401);
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('トークンの有効期限が切れています', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('無効なトークンです', 401);
      }
      throw error;
    }
  }

  /**
   * トークンを生成
   */
  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessTokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const refreshTokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessTokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY || '15m',
    });

    const refreshToken = jwt.sign(refreshTokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY || '7d',
    });

    return { accessToken, refreshToken };
  }
}