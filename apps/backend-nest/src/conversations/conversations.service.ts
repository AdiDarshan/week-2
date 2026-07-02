import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ConversationsDbService } from './conversations.db.service';
import { ConversationNotFoundError } from './conversations.errors';
import { UsersService } from '../users/users.service';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../common/constants';
import type { ConversationDocument } from './schemas/conversation.schema';
import type { User } from '../users/types';
import type { Conversation, ConversationType } from './types';

export type CreateConversationInput = {
  creator: User;
  participantIds: string[];
  title?: string;
  type?: ConversationType;
};

const AI_CONVERSATION_TITLES: Record<'assistant' | 'tutor', string> = {
  assistant: 'AI Assistant',
  tutor: 'AI Tutor',
};

@Injectable()
export class ConversationsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly conversationsDb: ConversationsDbService,
  ) {}

  async getConversationsForUser(user: User): Promise<Conversation[]> {
    const docs = await this.conversationsDb.listConversationsForUser(user.id);
    return docs.map(toConversation);
  }

  async findById(id: string): Promise<Conversation | undefined> {
    const doc = await this.conversationsDb.findConversationById(id);
    return doc ? toConversation(doc) : undefined;
  }

  async updateLastMessageAt(
    id: string,
    lastMessageAt: Date,
    session?: ClientSession,
  ): Promise<Conversation> {
    const doc = await this.conversationsDb.updateLastMessageAt(id, lastMessageAt, session);
    if (!doc) {
      throw new ConversationNotFoundError(id);
    }
    return toConversation(doc);
  }

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const type = input.type ?? 'human';
    return type === 'human'
      ? this.createHumanConversation(input)
      : this.createAiConversation(input.creator, type, input.title);
  }

  private async createAiConversation(
    creator: User,
    type: 'assistant' | 'tutor',
    title?: string,
  ): Promise<Conversation> {
    const doc = await this.conversationsDb.insertConversation({
      title: title?.trim() || AI_CONVERSATION_TITLES[type],
      type,
      participantIds: [creator.id, AI_ASSISTANT_PARTICIPANT_ID],
      lastMessageAt: new Date(),
    });
    return toConversation(doc);
  }

  private async createHumanConversation(
    input: CreateConversationInput,
  ): Promise<Conversation> {
    const uniqueIds = Array.from(
      new Set<string>([input.creator.id, ...input.participantIds]),
    );

    if (uniqueIds.length < 2) {
      throw new BadRequestException(
        'a conversation needs at least one other participant',
      );
    }

    const participants = await Promise.all(
      uniqueIds.map((id) =>
        this.usersService.findById(id).then((user) => {
          if (!user) {
            throw new NotFoundException(`unknown participant "${id}"`);
          }
          return user;
        }),
      ),
    );

    const title =
      input.title?.trim() || participants.map((u) => u.name).join(' & ');

    const doc = await this.conversationsDb.insertConversation({
      title,
      type: 'human',
      participantIds: participants.map((u) => u.id),
      lastMessageAt: new Date(),
    });

    return toConversation(doc);
  }
}

function toConversation(doc: ConversationDocument): Conversation {
  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    updatedAt: doc.lastMessageAt.toISOString(),
    participantIds: doc.participantIds,
  };
}
