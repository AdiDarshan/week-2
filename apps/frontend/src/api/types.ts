import type {
  ConversationDto,
  LoginResponseDto,
  MessageDto,
  UserDto,
} from '@week2/shared';

export type User = UserDto;

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

export type LoginResponse = LoginResponseDto;
