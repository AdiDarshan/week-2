
export type UserDto = {
  id: string;
  name: string;
};

export type ConversationType = 'human' | 'assistant' | 'tutor';

export type CitationDto = {
  chunkId: string;
  documentId: string;
  documentName: string;
  snippet: string;
  score: number;
};

export type ConversationDto = {
  id: string;
  title: string;
  type: ConversationType;
  updatedAt: string;
  participantIds: string[];
};

export type MessageDto = {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  citations?: CitationDto[];
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
  participantIds?: string[];
  title?: string;
  type?: ConversationType;
};

export type DocumentSummaryDto = {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
};

export type UploadDocumentRequestDto = {
  name: string;
  mimeType: string;
  content: string;
};

export type IngestionResultDto = {
  id: string;
  name: string;
  alreadyExisted: boolean;
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
  type: ConversationType;
};

export type Message = Omit<MessageDto, 'createdAt'> & {
  createdAt: Date;
  isPending: boolean;
};

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export type KnowledgeDocument = Omit<DocumentSummaryDto, 'createdAt'> & {
  createdAt: Date;
};
