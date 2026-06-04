import { randomUUID } from 'node:crypto';
import type { ConversationDto, MessageDto, MessagesPageDto, UserDto } from '@week2/shared';
import {
  findConversationById,
  findUserById,
  insertMessage,
  listMessagesForConversation,
  touchConversationUpdatedAt,
} from '../data/store.js';
import { ApiError } from '../errors/ApiError.js';

const MAX_MESSAGE_CONTENT_LENGTH = 4000;

export const DEFAULT_MESSAGES_LIMIT = 20;
const MAX_MESSAGES_LIMIT = 100;

export type GetMessagesPageInput = {
  conversationId: string;
  requesterId: string;
  cursor?: string;
  limit?: number;
};

export async function getMessagesPage(
  input: GetMessagesPageInput,
): Promise<MessagesPageDto> {
  const { conversation } = authorizeConversationAccess(
    input.requesterId,
    input.conversationId,
  );

  const startIndex = parseCursor(input.cursor);
  const limit = clampLimit(input.limit);

  const all = listMessagesForConversation(conversation.id);

  if (startIndex > all.length) {
    throw new ApiError('BAD_REQUEST', `invalid cursor "${input.cursor}"`);
  }

  const endIndex = startIndex + limit;
  const messages = all.slice(startIndex, endIndex);

  const hasMore = endIndex < all.length;
  const nextCursor = hasMore ? String(endIndex) : null;

  return { messages, nextCursor };
}

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
};

export async function createMessage(
  input: CreateMessageInput,
): Promise<MessageDto> {
  const { user: sender, conversation } = authorizeConversationAccess(
    input.senderId,
    input.conversationId,
  );

  const content = input.content.trim();
  if (content === '') {
    throw new ApiError('BAD_REQUEST', 'content must be a non-empty string');
  }
  if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    throw new ApiError('BAD_REQUEST', `content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`);
  }

  const createdAt = new Date().toISOString();
  const message: MessageDto = {
    id: randomUUID(),
    conversationId: conversation.id,
    content,
    senderId: sender.id,
    createdAt,
  };

  insertMessage(message);
  touchConversationUpdatedAt(conversation.id, createdAt);

  return message;
}

function authorizeConversationAccess(
  userId: string,
  conversationId: string,
): { user: UserDto; conversation: ConversationDto } {
  const user = findUserById(userId);
  if (!user) {
    throw new ApiError('NOT_FOUND', `unknown user "${userId}"`);
  }

  const conversation = findConversationById(conversationId);
  if (!conversation) {
    throw new ApiError('NOT_FOUND', `conversation "${conversationId}" not found`);
  }

  if (!conversation.participantIds.includes(user.id)) {
    throw new ApiError('FORBIDDEN', `user "${user.id}" is not a participant in conversation "${conversation.id}"`);
  }

  return { user, conversation };
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) {
    return 0;
  }
  const n = Number(cursor);
  if (!Number.isInteger(n) || n < 0) {
    throw new ApiError('BAD_REQUEST', `invalid cursor "${cursor}"`);
  }
  return n;
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_MESSAGES_LIMIT;
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new ApiError('BAD_REQUEST', `limit must be a positive integer`);
  }
  return Math.min(limit, MAX_MESSAGES_LIMIT);
}
