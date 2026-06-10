import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConversationsDbService } from './conversations-db.service';
import { UsersService } from '../users/users.service';
import { UserNotFoundError } from '../users/users.errors';
import type { User } from '../users/types';
import type { Conversation } from './types';

export type CreateConversationInput = {
  creator: User;
  participantIds: string[];
  title?: string;
};

@Injectable()
export class ConversationsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly conversationsDb: ConversationsDbService,
  ) {}

  async getConversationsForUser(user: User): Promise<Conversation[]> {
    return this.conversationsDb.listConversationsForUser(user.id);
  }

  findById(id: string): Conversation | undefined {
    return this.conversationsDb.findConversationById(id);
  }

  touchUpdatedAt(id: string, updatedAt: string): void {
    this.conversationsDb.touchConversationUpdatedAt(id, updatedAt);
  }

  async createConversation(
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

    const participants = uniqueIds.map((id) => {
      const user = this.usersService.findById(id);
      if (!user) {
        throw new UserNotFoundError(id);
      }
      return user;
    });

    const title =
      input.title?.trim() || participants.map((user) => user.name).join(' & ');

    const conversation: Conversation = {
      id: randomUUID(),
      title,
      updatedAt: new Date().toISOString(),
      participantIds: participants.map((user) => user.id),
    };

    this.conversationsDb.insertConversation(conversation);
    return conversation;
  }
}
