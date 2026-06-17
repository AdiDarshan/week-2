import { Injectable } from '@nestjs/common';
import type { Conversation } from './types';

@Injectable()
export class ConversationsDbService {
  private readonly conversations = new Map<string, Conversation>();

  listConversationsForUser(userId: string): Conversation[] {
    const result: Conversation[] = [];
    for (const conversation of this.conversations.values()) {
      if (conversation.participantIds.includes(userId)) {
        result.push(conversation);
      }
    }
    result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return result;
  }

  findConversationById(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  insertConversation(conversation: Conversation): void {
    this.conversations.set(conversation.id, conversation);
  }

  touchConversationUpdatedAt(conversationId: string, updatedAt: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.updatedAt = updatedAt;
    }
  }
}
