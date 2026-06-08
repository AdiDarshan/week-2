import { randomUUID } from 'node:crypto';
import type { ConversationDto, UserDto } from '@week2/shared';
import {
  findUserById,
  insertConversation,
  listConversationsForUser,
} from '../data/store.js';
import { ApiError } from '../errors/ApiError.js';

export async function getConversationsForUser(
  user: UserDto,
): Promise<ConversationDto[]> {
  return listConversationsForUser(user.id);
}

export type CreateConversationInput = {
  creator: UserDto;
  participantIds: string[];
  title?: string;
};

export async function createConversation(
  input: CreateConversationInput,
): Promise<ConversationDto> {

  const uniqueIds = Array.from(
    new Set<string>([input.creator.id, ...input.participantIds]),
  );

  if (uniqueIds.length < 2) {
    throw new ApiError('BAD_REQUEST', 'a conversation needs at least one other participant');
  }

  const participants = uniqueIds.map((id) => {
    const user = findUserById(id);
    if (!user) {
      throw new ApiError('NOT_FOUND', `unknown participant "${id}"`);
    }
    return user;
  });

  const title =
    input.title?.trim() ||
    participants.map((user) => user.name).join(' & ');

  const conversation: ConversationDto = {
    id: randomUUID(),
    title,
    updatedAt: new Date().toISOString(),
    participantIds: participants.map((user) => user.id),
  };

  insertConversation(conversation);
  return conversation;
}
