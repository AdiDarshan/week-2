import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import {
  ConversationNotFoundError,
  NotAConversationParticipantError,
} from '../conversations/conversations.errors';
import { MessagesDbService } from './messages-db.service';
import { UsersService } from '../users/users.service';
import { UserNotFoundError } from '../users/users.errors';
import type { Message, MessagesPage } from './types';

const MAX_MESSAGE_LENGTH = 500;

export const DEFAULT_MESSAGES_LIMIT = 20;
const MAX_MESSAGES_LIMIT = 100;

export type GetMessagesPageInput = {
  conversationId: string;
  requesterId: string;
  cursor?: string;
  limit?: number;
};

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesDb: MessagesDbService,
  ) {}

  async getMessagesPage(input: GetMessagesPageInput): Promise<MessagesPage> {
    const requester = this.usersService.findById(input.requesterId);
    if (!requester) {
      throw new UserNotFoundError(input.requesterId);
    }

    const conversation = this.conversationsService.findById(
      input.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    if (!conversation.participantIds.includes(requester.id)) {
      throw new NotAConversationParticipantError(requester.id, conversation.id);
    }

    const startIndex = parseCursor(input.cursor);
    const limit = clampLimit(input.limit);

    const all = this.messagesDb.listMessagesForConversation(conversation.id);

    if (startIndex > all.length) {
      throw new BadRequestException(`invalid cursor "${input.cursor}"`);
    }

    const endIndex = startIndex + limit;
    const messages = all.slice(startIndex, endIndex);

    const hasMore = endIndex < all.length;
    const nextCursor = hasMore ? String(endIndex) : null;

    return { messages, nextCursor };
  }

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const sender = this.usersService.findById(input.senderId);
    if (!sender) {
      throw new UserNotFoundError(input.senderId);
    }

    const conversation = this.conversationsService.findById(
      input.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    if (!conversation.participantIds.includes(sender.id)) {
      throw new NotAConversationParticipantError(sender.id, conversation.id);
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

    const createdAt = new Date().toISOString();
    const message: Message = {
      id: randomUUID(),
      conversationId: conversation.id,
      content,
      senderId: sender.id,
      createdAt,
    };

    this.messagesDb.insertMessage(message);
    this.conversationsService.touchUpdatedAt(conversation.id, createdAt);

    return message;
  }
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) {
    return 0;
  }
  const n = Number(cursor);
  if (!Number.isInteger(n) || n < 0) {
    throw new BadRequestException(`invalid cursor "${cursor}"`);
  }
  return n;
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_MESSAGES_LIMIT;
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new BadRequestException('limit must be a positive integer');
  }
  return Math.min(limit, MAX_MESSAGES_LIMIT);
}
