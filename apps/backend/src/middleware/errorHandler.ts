import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorDto } from '@week2/shared';
import { ApiError } from '../errors/ApiError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorDto = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.status).json(body);
    return;
  }

  console.error(err);

  const body: ApiErrorDto = {
    error: {
      code: 'INTERNAL',
      message: 'Something went wrong',
    },
  };
  res.status(500).json(body);
}
