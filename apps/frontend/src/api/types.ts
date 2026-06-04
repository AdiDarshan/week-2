export type User = {
  id: string;
  username: string;
  name: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: Date;
  participantIds: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: Date;
  isPending: boolean;
};

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export type LoginResponse = {
  token: string;
  user: User;
};
