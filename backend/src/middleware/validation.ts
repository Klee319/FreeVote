import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/errors";

/**
 * バリデーションエラーをチェックするミドルウェア
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => {
      if ("msg" in error) {
        return error.msg;
      }
      return "バリデーションエラーが発生しました";
    });

    return next(new ApiError(400, errorMessages.join(", ")));
  }

  next();
};