import type { Citation } from '../knowledge/types';

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  citations?: Citation[];
  createdAt: string;
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}
