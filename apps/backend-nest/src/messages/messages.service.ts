import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ConversationsService } from '../conversations/conversations.service';
import {
  ConversationNotFoundError,
  NotAConversationParticipantError,
} from '../conversations/conversations.errors';
import { MessagesDbService } from './messages.db.service';
import type { MessageDocument } from './schemas/message.schema';
import { UsersService } from '../users/users.service';
import { UserNotFoundError } from '../users/users.errors';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../common/constants';
import type { Message, MessagesPage } from './types';
import type { CreateMessageInput, DecodedCursor } from './messages.db.service';

const MAX_MESSAGE_LENGTH = 4000;

export const DEFAULT_MESSAGES_LIMIT = 20;
const MAX_MESSAGES_LIMIT = 100;

const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 50;

export type GetMessagesPageInput = {
  conversationId: string;
  requesterId: string;
  cursor?: string;
  limit?: number;
};

export type SearchMyMessagesInput = {
  userId: string;
  query: string;
  limit?: number;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesDb: MessagesDbService,
  ) {}

  async getMessagesPage(input: GetMessagesPageInput): Promise<MessagesPage> {
    const requester = await this.usersService.findById(input.requesterId);
    if (!requester) {
      throw new UserNotFoundError(input.requesterId);
    }

    const conversation = await this.conversationsService.findById(
      input.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    if (!conversation.participantIds.includes(requester.id)) {
      throw new NotAConversationParticipantError(requester.id, conversation.id);
    }

    const limit = clampLimit(
      input.limit,
      DEFAULT_MESSAGES_LIMIT,
      MAX_MESSAGES_LIMIT,
    );
    const cursor = input.cursor ? decodeCursor(input.cursor) : undefined;

    const { messages: docs, hasMore } = await this.messagesDb.findConversationMessages(
      conversation.id,
      limit,
      cursor,
    );

    const messages: Message[] = docs.map(toMessage);
    const nextCursor = hasMore ? encodeCursor(docs[docs.length - 1]) : null;

    return { messages, nextCursor };
  }

  async searchMyMessages(input: SearchMyMessagesInput): Promise<Message[]> {
    const user = await this.usersService.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const query = input.query.trim();
    if (query === '') {
      throw new BadRequestException('query must be a non-empty string');
    }

    const conversations =
      await this.conversationsService.getConversationsForUser(user);
    const conversationIds = conversations.map((conversation) => conversation.id);

    const docs = await this.messagesDb.searchMessagesInConversations(
      conversationIds,
      escapeRegExp(query),
      clampLimit(input.limit, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT),
    );

    return docs.map(toMessage);
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    if (input.senderId !== AI_ASSISTANT_PARTICIPANT_ID) {
      const sender = await this.usersService.findById(input.senderId);
      if (!sender) {
        throw new UserNotFoundError(input.senderId);
      }
    }

    const conversation = await this.conversationsService.findById(
      input.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    if (!conversation.participantIds.includes(input.senderId)) {
      throw new NotAConversationParticipantError(input.senderId, conversation.id);
    }

    const content = input.content.trim();
    if (content === '') {
      throw new BadRequestException('content must be a non-empty string');
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `content must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      );
    }

    const session = await this.connection.startSession();
    let doc: MessageDocument;
    try {
      await session.withTransaction(async () => {
        doc = await this.messagesDb.insertMessage(input, session);
        await this.conversationsService.updateLastMessageAt(
          conversation.id,
          doc.createdAt,
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    return toMessage(doc!);
  }
}

function toMessage(doc: MessageDocument): Message {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId,
    content: doc.content,
    senderId: doc.senderId,
    createdAt: doc.createdAt.toISOString(),
  };
}

function encodeCursor(doc: MessageDocument): string {
  const createdAtIso = new Date(doc.createdAt).toISOString();
  const id = String(doc._id);
  return Buffer.from(`${createdAtIso}|${id}`).toString('base64');
}

function decodeCursor(cursor: string): DecodedCursor {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const [createdAtIso, id] = decoded.split('|');
  return {
    createdAt: new Date(createdAtIso),
    id: new Types.ObjectId(id),
  };
}

function clampLimit(
  limit: number | undefined,
  fallback: number,
  max: number,
): number {
  if (limit === undefined) {
    return fallback;
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new BadRequestException('limit must be a positive integer');
  }
  return Math.min(limit, max);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
