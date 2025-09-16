import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error-handler';

const authService = new AuthService();

export class AuthController {
  // ユーザー登録
  register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  });

  // ログイン
  login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  });

  // SNS連携ログイン
  socialLogin = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { provider, providerId } = req.body;
    const result = await authService.socialLogin(provider, providerId);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  });

  // リフレッシュトークン
  refresh = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          message: 'リフレッシュトークンが必要です',
          code: 'MISSING_REFRESH_TOKEN',
        },
      });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  });

  // ログアウト
  logout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      data: {
        message: 'ログアウトしました',
      },
    });
  });

  // 現在のユーザー情報取得
  getMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: '認証が必要です',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: { user },
    });
  });
}