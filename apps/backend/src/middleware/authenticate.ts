import type { NextFunction, Request, Response } from 'express';
import type { UserDto } from '@week2/shared';
import { resolveSessionUser } from '../services/auth.service.js';
import { ApiError } from '../errors/ApiError.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserDto;
    }
  }
}

const BEARER_PREFIX = 'Bearer ';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header('authorization');
    if (typeof header !== 'string' || header.trim() === '') {
      throw new ApiError('UNAUTHENTICATED', 'missing Authorization header');
    }
    if (!header.startsWith(BEARER_PREFIX)) {
      throw new ApiError('UNAUTHENTICATED', 'Authorization header must use the Bearer scheme');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    req.user = await resolveSessionUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function getAuthenticatedUser(req: Request): UserDto {
  if (!req.user) {
    throw new ApiError('INTERNAL', 'authenticate middleware not applied');
  }
  return req.user;
}
