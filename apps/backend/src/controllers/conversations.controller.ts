import type { Request, Response } from 'express';
import type { CreateConversationRequestDto } from '@week2/shared';
import {
  createConversation,
  getConversationsForUser,
} from '../services/conversations.service.js';
import { getAuthenticatedUser } from '../middleware/authenticate.js';
import { ApiError } from '../errors/ApiError.js';

export async function listConversations(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthenticatedUser(req);
  const conversations = await getConversationsForUser(user);
  res.status(200).json(conversations);
}

export async function postConversation(
  req: Request,
  res: Response,
): Promise<void> {
  const body = (req.body ?? {}) as Partial<CreateConversationRequestDto>;
  const { participantIds, title } = body;

  if (!Array.isArray(participantIds)) {
    throw new ApiError('BAD_REQUEST', 'participantIds must be an array of user ids');
  }
  if (!participantIds.every((id) => typeof id === 'string' && id.trim() !== '')) {
    throw new ApiError('BAD_REQUEST', 'participantIds must contain non-empty strings');
  }
  if (title !== undefined && typeof title !== 'string') {
    throw new ApiError('BAD_REQUEST', 'title must be a string when provided');
  }
  const user = getAuthenticatedUser(req);
  const conversation = await createConversation({
    creator: user,
    participantIds: participantIds.map((id) => id.trim()),
    title,
  });

  res.status(201).json(conversation);
}
