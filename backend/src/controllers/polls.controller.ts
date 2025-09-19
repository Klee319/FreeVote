import { Request, Response, NextFunction } from 'express';
import { PollsService } from '../services/polls.service';
import { asyncHandler } from '../middleware/error-handler';

const pollsService = new PollsService();

export class PollsController {
  // 投票一覧取得
  getPolls = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const filters = {
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      sort: req.query.sort as 'new' | 'trending' | 'voteCount' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    };

    const result = await pollsService.getPolls(filters);

    res.json({
      success: true,
      data: result,
    });
  });

  // 投票詳細取得
  getPollById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const result = await pollsService.getPollById(id);

    res.json({
      success: true,
      data: result,
    });
  });

  // 投票する
  vote = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const voteData = {
      ...req.body,
      userId: req.user?.userId,
    };

    const result = await pollsService.vote(id, voteData);

    res.json({
      success: true,
      data: result,
    });
  });

  // 都道府県ごとのトップ選択肢取得
  getTopByPrefecture = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const result = await pollsService.getTopByPrefecture(id);

    res.json({
      success: true,
      data: result,
    });
  });

  // 詳細統計取得
  getStats = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const filterBy = req.query.filterBy as 'age' | 'gender' | 'prefecture' | undefined;
    const result = await pollsService.getStats(id, filterBy);

    res.json({
      success: true,
      data: result,
    });
  });
}