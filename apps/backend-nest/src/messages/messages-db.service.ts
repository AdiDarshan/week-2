import { Injectable } from '@nestjs/common';
import type { Message } from './types';

@Injectable()
export class MessagesDbService {
  private readonly messages: Message[] = [];

  listMessagesForConversation(conversationId: string): Message[] {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  insertMessage(message: Message): void {
    this.messages.push(message);
  }
}
