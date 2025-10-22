import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, ConflictError, AuthorizationError } from '../utils/errors';

const prisma = new PrismaClient();

interface CommentFilters {
  page?: number;
  limit?: number;
  sort?: 'new' | 'popular';
}

interface CreateCommentData {
  content: string;
  userToken?: string;
  userId?: string;
  guestName?: string;
  parentId?: string;
}

export class CommentsService {
  // コメント一覧取得
  async getComments(pollId: string, filters: CommentFilters = {}) {
    const {
      page = 1,
      limit = 20,
      sort = 'new',
    } = filters;

    // 投票の存在確認
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    const skip = (page - 1) * limit;

    // ソート条件
    let orderBy: any = {};
    switch (sort) {
      case 'popular':
        orderBy = { likeCount: 'desc' };
        break;
      case 'new':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // トップレベルのコメントのみを取得（parentIdがnullのもの）
    const [comments, total] = await Promise.all([
      prisma.pollComment.findMany({
        where: {
          pollId,
          parentId: null,
        },
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.pollComment.count({
        where: {
          pollId,
          parentId: null,
        },
      }),
    ]);

    // レスポンス整形
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      author: comment.userId ? {
        id: comment.user?.id,
        username: comment.user?.username,
        avatarUrl: comment.user?.avatarUrl,
      } : {
        guestName: comment.guestName || 'ゲスト',
      },
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: reply.userId ? {
          id: reply.user?.id,
          username: reply.user?.username,
          avatarUrl: reply.user?.avatarUrl,
        } : {
          guestName: reply.guestName || 'ゲスト',
        },
        likeCount: reply.likeCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      })),
    }));

    return {
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // コメント投稿
  async createComment(pollId: string, data: CreateCommentData) {
    // バリデーション
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('コメント内容を入力してください');
    }

    if (data.content.length > 500) {
      throw new ValidationError('コメントは500文字以内で入力してください');
    }

    // 投票の存在確認
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundError('投票が見つかりません');
    }

    // parentIdが指定されている場合、親コメントの存在確認
    if (data.parentId) {
      const parentComment = await prisma.pollComment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new NotFoundError('返信先のコメントが見つかりません');
      }

      if (parentComment.pollId !== pollId) {
        throw new ValidationError('異なる投票のコメントには返信できません');
      }

      // 返信の返信は許可しない（ネストレベル1まで）
      if (parentComment.parentId) {
        throw new ValidationError('返信に対する返信はできません');
      }
    }

    // userTokenの生成または使用
    let userToken = data.userToken;
    if (!userToken) {
      userToken = uuidv4();
    }

    // ゲストユーザーの場合、ゲスト名のバリデーション
    let guestName = data.guestName;
    if (!data.userId) {
      if (!guestName || guestName.trim().length === 0) {
        guestName = 'ゲスト';
      }
      if (guestName.length > 50) {
        throw new ValidationError('ゲスト名は50文字以内で入力してください');
      }
    }

    // コメントを保存
    const comment = await prisma.pollComment.create({
      data: {
        pollId,
        content: data.content.trim(),
        userId: data.userId,
        userToken,
        guestName: !data.userId ? guestName : null,
        parentId: data.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // トップレベルコメントの場合、投票のコメント数を増加
    if (!data.parentId) {
      await prisma.poll.update({
        where: { id: pollId },
        data: { commentCount: { increment: 1 } },
      });
    }

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        author: comment.userId ? {
          id: comment.user?.id,
          username: comment.user?.username,
          avatarUrl: comment.user?.avatarUrl,
        } : {
          guestName: comment.guestName || 'ゲスト',
        },
        likeCount: comment.likeCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      userToken,
    };
  }

  // コメントにいいね
  async likeComment(pollId: string, commentId: string, userToken?: string, userId?: string) {
    // コメントの存在確認
    const comment = await prisma.pollComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('コメントが見つかりません');
    }

    if (comment.pollId !== pollId) {
      throw new ValidationError('異なる投票のコメントにはいいねできません');
    }

    // userTokenの生成または使用
    let token = userToken;
    if (!token) {
      token = uuidv4();
    }

    // 重複いいねチェック
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userToken: {
          commentId,
          userToken: token,
        },
      },
    });

    if (existingLike) {
      throw new ConflictError('すでにいいね済みです');
    }

    // いいねを保存
    await prisma.commentLike.create({
      data: {
        commentId,
        userToken: token,
        userId,
      },
    });

    // コメントのいいね数を増加
    const updatedComment = await prisma.pollComment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
    });

    return {
      likeCount: updatedComment.likeCount,
      userToken: token,
    };
  }

  // コメント削除
  async deleteComment(pollId: string, commentId: string, userToken?: string, userId?: string) {
    // コメントの存在確認
    const comment = await prisma.pollComment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundError('コメントが見つかりません');
    }

    if (comment.pollId !== pollId) {
      throw new ValidationError('異なる投票のコメントは削除できません');
    }

    // 削除権限チェック（コメント投稿者のみ削除可能）
    const isOwner = (comment.userId && userId && comment.userId === userId) ||
                    (comment.userToken === userToken);

    if (!isOwner) {
      throw new AuthorizationError('このコメントを削除する権限がありません');
    }

    // コメントを削除（カスケードで返信も削除される）
    await prisma.pollComment.delete({
      where: { id: commentId },
    });

    // トップレベルコメントの場合、投票のコメント数を減少
    if (!comment.parentId) {
      await prisma.poll.update({
        where: { id: pollId },
        data: { commentCount: { decrement: 1 } },
      });
    }

    return {
      success: true,
      message: 'コメントを削除しました',
    };
  }
}
