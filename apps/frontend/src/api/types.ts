
export type UserDto = {
  id: string;
  name: string;
};

export type ConversationDto = {
  id: string;
  title: string;
  updatedAt: string;
  participantIds: string[];
};

export type MessageDto = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: string;
};

export type MessagesPageDto = {
  messages: MessageDto[];
  nextCursor: string | null;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type SignupRequestDto = {
  email: string;
  password: string;
  name: string;
};

export type LoginResponseDto = {
  token: string;
  user: UserDto;
};

export type SendMessageRequestDto = {
  content: string;
};

export type CreateConversationRequestDto = {
  participantIds: string[];
  title?: string;
};

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export type ApiErrorDto = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type Conversation = Omit<ConversationDto, 'updatedAt'> & {
  updatedAt: Date;
};

export type Message = Omit<MessageDto, 'createdAt'> & {
  createdAt: Date;
  isPending: boolean;
};

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};
