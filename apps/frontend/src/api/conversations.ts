import { apiRequest } from './client';
import type {
  Conversation,
  ConversationDto,
  CreateConversationRequestDto,
} from './types';

function fromConversationDto(dto: ConversationDto): Conversation {
  return {
    ...dto,
    updatedAt: new Date(dto.updatedAt),
  };
}

export async function getConversations(token: string): Promise<Conversation[]> {
  const dtos = await apiRequest<ConversationDto[]>('/conversations', { token });
  return dtos.map(fromConversationDto);
}

export async function createConversation(
  token: string,
  body: CreateConversationRequestDto,
): Promise<Conversation> {
  const dto = await apiRequest<ConversationDto>('/conversations', {
    method: 'POST',
    token,
    body,
  });
  return fromConversationDto(dto);
}
