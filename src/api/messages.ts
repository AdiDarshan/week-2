import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from './mockData';
import type { Message, MessagesPage } from './types';

const PAGE_SIZE = 2;

export async function getMessages(
  conversationId: string,
  cursor?: string,
): Promise<MessagesPage> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // fake delay

  const allMessagesForConversation = MOCK_MESSAGES
    .filter((message) => message.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const startIndex = cursor ? Number(cursor) : 0;
  const endIndex = startIndex + PAGE_SIZE;

  const pageMessages: Message[] = allMessagesForConversation.slice(startIndex, endIndex);

  const hasMore = endIndex < allMessagesForConversation.length;
  const nextCursor = hasMore ? String(endIndex) : null;

  return {
    messages: pageMessages,
    nextCursor,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string,
  senderId: string,
): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const message: Message = {
    id: crypto.randomUUID(),
    conversationId,
    content,
    senderId,
    createdAt: new Date(),
    isPending: false,
  };
  MOCK_MESSAGES.push(message);

  const conversation = MOCK_CONVERSATIONS.find(
    (conversation) => conversation.id === conversationId,
  );
  if (conversation) {
    conversation.updatedAt = message.createdAt;
  }

  return message;
}
