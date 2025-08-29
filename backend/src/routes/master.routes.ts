import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/prefectures
 * @desc 都道府県一覧取得
 * @access Public
 */
router.get('/prefectures', async (req, res, next) => {
  try {
    const prefectures = await prisma.prefecture.findMany({
      orderBy: { code: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: prefectures,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/categories
 * @desc カテゴリ一覧取得
 * @access Public
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.wordCategory.findMany({
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/accent-types
 * @desc アクセント型一覧取得
 * @access Public
 */
router.get('/accent-types', async (req, res, next) => {
  try {
    const accentTypes = await prisma.accentType.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: accentTypes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;