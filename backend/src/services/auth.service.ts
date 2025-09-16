import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';
import { AuthenticationError, ConflictError, ValidationError } from '../utils/errors';
import { userRegistrationSchema, loginSchema } from '../utils/validation';
import { JwtPayload } from '../middleware/auth';

const prisma = new PrismaClient();

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // アクセストークン生成
  private generateAccessToken(payload: JwtPayload): string {
    const options: any = {
      expiresIn: config.jwt.accessTokenExpiry,
    };
    return jwt.sign(payload, config.jwt.secret, options);
  }

  // リフレッシュトークン生成と保存
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  // ユーザー登録
  async register(data: any): Promise<{ user: any; tokens: TokenPair }> {
    const validated = userRegistrationSchema.parse(data);

    // メール登録の場合
    if (validated.email && validated.password) {
      // 既存ユーザーチェック
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        throw new ConflictError('このメールアドレスは既に登録されています');
      }

      // パスワードのハッシュ化
      const passwordHash = await bcrypt.hash(validated.password, 10);

      // ユーザー作成
      const user = await prisma.user.create({
        data: {
          username: validated.username,
          email: validated.email,
          passwordHash,
          ageGroup: validated.ageGroup,
          prefecture: validated.prefecture,
          gender: validated.gender,
        },
        select: {
          id: true,
          username: true,
          email: true,
          ageGroup: true,
          prefecture: true,
          gender: true,
          referralCount: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      // トークン生成
      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email!,
        isAdmin: user.isAdmin,
      });
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        user,
        tokens: { accessToken, refreshToken },
      };
    }

    // SNS連携の場合
    if (validated.provider && validated.providerId) {
      // 既存ユーザーチェック
      const existingUser = await prisma.user.findFirst({
        where: {
          provider: validated.provider,
          providerId: validated.providerId,
        },
      });

      if (existingUser) {
        throw new ConflictError('このアカウントは既に登録されています');
      }

      // ユーザー作成
      const user = await prisma.user.create({
        data: {
          username: validated.username,
          provider: validated.provider,
          providerId: validated.providerId,
          ageGroup: validated.ageGroup,
          prefecture: validated.prefecture,
          gender: validated.gender,
        },
        select: {
          id: true,
          username: true,
          ageGroup: true,
          prefecture: true,
          gender: true,
          referralCount: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      // トークン生成
      const accessToken = this.generateAccessToken({
        userId: user.id,
        isAdmin: user.isAdmin,
      });
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        user,
        tokens: { accessToken, refreshToken },
      };
    }

    throw new ValidationError('メールアドレスまたはSNS連携情報が必要です');
  }

  // ログイン
  async login(data: any): Promise<{ user: any; tokens: TokenPair }> {
    const validated = loginSchema.parse(data);

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        referralCount: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('メールアドレスまたはパスワードが正しくありません');
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('メールアドレスまたはパスワードが正しくありません');
    }

    // トークン生成
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email!,
      isAdmin: user.isAdmin,
    });
    const refreshToken = await this.generateRefreshToken(user.id);

    // パスワードハッシュを除外して返す
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    };
  }

  // SNS連携ログイン
  async socialLogin(provider: string, providerId: string): Promise<{ user: any; tokens: TokenPair }> {
    const user = await prisma.user.findFirst({
      where: {
        provider,
        providerId,
      },
      select: {
        id: true,
        username: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        referralCount: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('アカウントが見つかりません。先に登録してください。');
    }

    // トークン生成
    const accessToken = this.generateAccessToken({
      userId: user.id,
      isAdmin: user.isAdmin,
    });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  // リフレッシュトークンによる新しいアクセストークン発行
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // リフレッシュトークンの検証
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AuthenticationError('無効なリフレッシュトークンです');
    }

    if (tokenRecord.expiresAt < new Date()) {
      // 期限切れのトークンを削除
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new AuthenticationError('リフレッシュトークンの有効期限が切れています');
    }

    // 古いリフレッシュトークンを削除
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // 新しいトークンペアを生成
    const accessToken = this.generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email || undefined,
      isAdmin: tokenRecord.user.isAdmin,
    });
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ログアウト
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // 現在のユーザー情報取得
  async getCurrentUser(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        ageGroup: true,
        prefecture: true,
        gender: true,
        referralCount: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('ユーザーが見つかりません');
    }

    return user;
  }
}