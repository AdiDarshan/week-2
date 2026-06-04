import type { Request, Response } from 'express';
import type { SendMessageRequestDto } from '@week2/shared';
import {
  createMessage,
  getMessagesPage,
} from '../services/messages.service.js';
import { getAuthenticatedUser } from '../middleware/authenticate.js';
import { ApiError } from '../errors/ApiError.js';

export async function listMessages(
  req: Request,
  res: Response,
): Promise<void> {
  const conversationId = req.params.id;
  if (typeof conversationId !== 'string' || conversationId.trim() === '') {
    throw new ApiError('BAD_REQUEST', 'conversation id is required');
  }

  const { cursor, limit } = req.query;

  if (cursor !== undefined && typeof cursor !== 'string') {
    throw new ApiError('BAD_REQUEST', 'cursor must be a string when provided');
  }
  if (limit !== undefined && typeof limit !== 'string') {
    throw new ApiError('BAD_REQUEST', 'limit must be a string when provided');
  }
  const user = getAuthenticatedUser(req);

  const page = await getMessagesPage({
    conversationId,
    requesterId: user.id,
    cursor,
    limit: limit === undefined ? undefined : Number(limit),
  });

  res.status(200).json(page);
}

export async function postMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const conversationId = req.params.id;
  if (typeof conversationId !== 'string' || conversationId.trim() === '') {
    throw new ApiError('BAD_REQUEST', 'conversation id is required');
  }

  const body = (req.body ?? {}) as Partial<SendMessageRequestDto>;
  if (typeof body.content !== 'string') {
    throw new ApiError('BAD_REQUEST', 'content must be a string');
  }
  const user = getAuthenticatedUser(req);

  const message = await createMessage({
    conversationId,
    senderId: user.id,
    content: body.content,
  });

  res.status(201).json(message);
}
