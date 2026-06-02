import { MOCK_CONVERSATIONS } from './mockData';
import type { Conversation } from './types';

export async function getConversations(userId: string): Promise<Conversation[]> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // fake delay
  return MOCK_CONVERSATIONS.filter((conversation) =>
    conversation.participantIds.includes(userId),
  );
}
