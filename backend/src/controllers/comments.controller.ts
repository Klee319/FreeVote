import { Request, Response, NextFunction } from 'express';
import { CommentsService } from '../services/comments.service';
import { asyncHandler } from '../middleware/error-handler';

const commentsService = new CommentsService();

export class CommentsController {
  // コメント一覧取得
  getComments = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id: pollId } = req.params;
    const { page, limit, sort } = req.query;

    const filters = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sort: sort as 'new' | 'popular' | undefined,
    };

    const result = await commentsService.getComments(pollId, filters);

    res.json({
      success: true,
      data: result,
    });
  });

  // コメント投稿
  createComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id: pollId } = req.params;
    const { content, guestName, parentId } = req.body;

    // userTokenをヘッダーから取得
    const userToken = req.headers['x-user-token'] as string | undefined;
    const userId = req.user?.userId;

    const result = await commentsService.createComment(pollId, {
      content,
      guestName,
      parentId,
      userToken,
      userId,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  // コメントにいいね
  likeComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id: pollId, commentId } = req.params;

    // userTokenをヘッダーから取得
    const userToken = req.headers['x-user-token'] as string | undefined;
    const userId = req.user?.userId;

    const result = await commentsService.likeComment(pollId, commentId, userToken, userId);

    res.json({
      success: true,
      data: result,
    });
  });

  // コメント削除
  deleteComment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id: pollId, commentId } = req.params;

    // userTokenをヘッダーから取得
    const userToken = req.headers['x-user-token'] as string | undefined;
    const userId = req.user?.userId;

    const result = await commentsService.deleteComment(pollId, commentId, userToken, userId);

    res.json({
      success: true,
      data: result,
    });
  });
}
