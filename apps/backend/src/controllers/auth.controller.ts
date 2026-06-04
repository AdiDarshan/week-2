import type { Request, Response } from 'express';
import type { LoginRequestDto } from '@week2/shared';
import { login } from '../services/auth.service.js';
import { ApiError } from '../errors/ApiError.js';

export async function postLogin(req: Request, res: Response): Promise<void> {
  const { username } = (req.body ?? {}) as Partial<LoginRequestDto>;

  if (typeof username !== 'string' || username.trim() === '') {
    throw new ApiError('BAD_REQUEST', 'username is required');
  }

  const result = await login(username);
  res.status(200).json(result);
}
