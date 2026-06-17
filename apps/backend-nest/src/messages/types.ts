export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}
