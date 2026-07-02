import { apiRequest } from './client';
import type {
  CitationDto,
  Message,
  MessageDto,
  MessagesPage,
  MessagesPageDto,
  SendMessageRequestDto,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

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

export interface PersistedAssistantMessage {
  id: string;
  createdAt: string;
  citations?: CitationDto[];
}

export async function streamAiReply(
  conversationId: string,
  token: string,
  onToken: (token: string) => void,
  onDone: (fullContent: string, persisted: PersistedAssistantMessage) => void,
  onError: (err: Error) => void,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat/ai/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId }),
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error('Network error'));
    return;
  }

  if (!response.ok || !response.body) {
    onError(new Error(`Stream failed with status ${response.status}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const eventMatch = part.match(/^event: (.+)/m);
        const dataMatch = part.match(/^data: (.*)/m);

        if (eventMatch?.[1] === 'done') {
          const persisted = parsePersistedMessage(dataMatch?.[1]);
          if (!persisted) {
            onError(new Error('Stream ended without a persisted message.'));
            return;
          }
          onDone(accumulated, persisted);
          return;
        }
        if (dataMatch) {
          accumulated += dataMatch[1];
          onToken(dataMatch[1]);
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error('Stream read error'));
  }
}

function parsePersistedMessage(
  data: string | undefined,
): PersistedAssistantMessage | null {
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'createdAt' in parsed &&
      typeof (parsed as PersistedAssistantMessage).id === 'string' &&
      typeof (parsed as PersistedAssistantMessage).createdAt === 'string'
    ) {
      return parsed as PersistedAssistantMessage;
    }
  } catch {
    return null;
  }
  return null;
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
