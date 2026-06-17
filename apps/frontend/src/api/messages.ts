import { apiRequest } from './client';
import type {
  Message,
  MessageDto,
  MessagesPage,
  MessagesPageDto,
  SendMessageRequestDto,
} from './types';

function fromMessageDto(dto: MessageDto): Message {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    isPending: false,
  };
}

export async function getMessages(
  conversationId: string,
  token: string,
  cursor?: string,
): Promise<MessagesPage> {
  const page = await apiRequest<MessagesPageDto>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      token,
      query: { cursor },
    },
  );

  return {
    messages: page.messages.map(fromMessageDto),
    nextCursor: page.nextCursor,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string,
): Promise<Message> {
  const body: SendMessageRequestDto = { content };
  const dto = await apiRequest<MessageDto>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      token,
      body,
    },
  );
  return fromMessageDto(dto);
}
