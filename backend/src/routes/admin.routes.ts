import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { devAdminAuth } from "../middleware/admin-auth";
import { validateRequest } from "../middleware/validation";
import { body, query, param } from "express-validator";

const router = Router();

// すべてのルートに管理者認証を適用
router.use(devAdminAuth);

// ダッシュボード統計
router.get("/dashboard/stats", adminController.getDashboardStats);

// 投票管理
router.get(
  "/polls",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["active", "closed", "draft"]),
    query("category").optional().isString(),
    query("search").optional().isString(),
  ],
  validateRequest,
  adminController.getPolls
);

router.post(
  "/polls",
  [
    body("title").notEmpty().withMessage("タイトルは必須です"),
    body("description").notEmpty().withMessage("説明は必須です"),
    body("options").isArray({ min: 2, max: 4 }).withMessage("選択肢は2〜4個必要です"),
    body("deadline").isISO8601().withMessage("有効な締切日時を指定してください"),
    body("category").optional().isString(),
    body("isAccentMode").optional().isBoolean(),
  ],
  validateRequest,
  adminController.createPoll
);

router.put(
  "/polls/:id",
  [
    param("id").notEmpty(),
    body("title").optional().notEmpty(),
    body("description").optional().notEmpty(),
    body("options").optional().isArray({ min: 2, max: 4 }),
    body("deadline").optional().isISO8601(),
  ],
  validateRequest,
  adminController.updatePoll
);

router.delete(
  "/polls/:id",
  [param("id").notEmpty()],
  validateRequest,
  adminController.deletePoll
);

// ユーザー提案管理
router.get(
  "/requests",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["pending", "approved", "rejected"]),
  ],
  validateRequest,
  adminController.getRequests
);

router.post(
  "/requests/:id/approve",
  [param("id").notEmpty()],
  validateRequest,
  adminController.approveRequest
);

router.post(
  "/requests/:id/reject",
  [
    param("id").notEmpty(),
    body("reason").optional().isString(),
  ],
  validateRequest,
  adminController.rejectRequest
);

// データインポート/エクスポート
router.post(
  "/import",
  [
    body("polls").isArray().withMessage("投票データの配列を提供してください"),
  ],
  validateRequest,
  adminController.importData
);

router.get(
  "/export",
  [
    query("type").optional().isIn(["all", "polls", "votes", "users"]),
  ],
  validateRequest,
  adminController.exportData
);

// ユーザー管理
router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("role").optional().isIn(["user", "admin"]),
  ],
  validateRequest,
  adminController.getUsers
);

router.put(
  "/users/:id",
  [
    param("id").notEmpty(),
    body("username").optional().isString(),
    body("ageGroup").optional().isString(),
    body("prefecture").optional().isString(),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("role").optional().isIn(["user", "admin"]),
  ],
  validateRequest,
  adminController.updateUser
);

router.delete(
  "/users/:id",
  [param("id").notEmpty()],
  validateRequest,
  adminController.deleteUser
);

export default router;