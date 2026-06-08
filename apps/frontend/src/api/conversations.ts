import type { ConversationDto } from '@week2/shared';
import { apiRequest } from './client';
import type { Conversation } from './types';

export async function getConversations(token: string): Promise<Conversation[]> {
  const dtos = await apiRequest<ConversationDto[]>('/conversations', { token });
  return dtos.map((dto) => ({
    ...dto,
    updatedAt: new Date(dto.updatedAt),
  }));
}
