import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service";
import { ApiError } from "../utils/errors";

export class AdminController {
  /**
   * 管理者ダッシュボード統計取得
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票一覧取得（管理者用）
   */
  async getPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, search, page = 1, limit = 20 } = req.query;

      const polls = await adminService.getPolls({
        status: status as string,
        category: category as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        data: polls,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票作成
   */
  async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const pollData = req.body;
      const createdBy = (req as any).user?.id || "admin"; // 認証実装後に更新

      const poll = await adminService.createPoll({
        ...pollData,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票更新
   */
  async updatePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pollData = req.body;

      const poll = await adminService.updatePoll(id, pollData);

      res.json({
        success: true,
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 投票削除
   */
  async deletePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await adminService.deletePoll(id);

      res.json({
        success: true,
        message: "投票を削除しました",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー提案一覧取得
   */
  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const requests = await adminService.getRequests({
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー提案承認
   */
  async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { adminComment } = req.body;

      const poll = await adminService.approveRequest(id, adminComment);

      res.json({
        success: true,
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー提案却下
   */
  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectionReason, adminComment } = req.body;

      await adminService.rejectRequest(id, rejectionReason, adminComment);

      res.json({
        success: true,
        message: "提案を却下しました",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * データインポート
   */
  async importData(req: Request, res: Response, next: NextFunction) {
    try {
      const { polls } = req.body;

      if (!polls || !Array.isArray(polls)) {
        throw new ApiError(400, "有効なデータを提供してください");
      }

      const results = await adminService.importPolls(polls);

      res.json({
        success: true,
        data: {
          imported: results.success,
          failed: results.failed,
          total: polls.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * データエクスポート
   */
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const { type = "all" } = req.query;

      const data = await adminService.exportData(type as string);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー一覧取得
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, role, page = 1, limit = 20 } = req.query;

      const users = await adminService.getUsers({
        search: search as string,
        role: role as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー更新
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await adminService.updateUser(id, userData);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ユーザー削除
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await adminService.deleteUser(id);

      res.json({
        success: true,
        message: "ユーザーを削除しました",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();