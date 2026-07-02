import { Types } from 'mongoose';
import type {
  MessagesDbService,
  CreateMessageInput,
  DecodedCursor,
} from '../messages/messages.db.service';
import type { MessageDocument } from '../messages/schemas/message.schema';

type StoredMessage = {
  _id: Types.ObjectId;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
};

export class MessagesDbFake
  implements
    Pick<
      MessagesDbService,
      'findConversationMessages' | 'searchMessagesInConversations' | 'insertMessage'
    >
{
  private readonly messages: StoredMessage[] = [];

  async findConversationMessages(
    conversationId: string,
    limit: number,
    cursor?: DecodedCursor,
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    const matching = this.messages
      .filter((m) => m.conversationId === conversationId)
      .filter((m) => (cursor ? isOlderThanCursor(m, cursor) : true))
      .sort(byCreatedAtDesc);

    const hasMore = matching.length > limit;
    return {
      messages: matching.slice(0, limit).map(toDocument),
      hasMore,
    };
  }

  async searchMessagesInConversations(
    conversationIds: string[],
    escapedQuery: string,
    limit: number,
  ): Promise<MessageDocument[]> {
    const pattern = new RegExp(escapedQuery, 'i');
    return this.messages
      .filter((m) => conversationIds.includes(m.conversationId))
      .filter((m) => pattern.test(m.content))
      .sort(byCreatedAtDesc)
      .slice(0, limit)
      .map(toDocument);
  }

  async insertMessage(input: CreateMessageInput): Promise<MessageDocument> {
    const stored: StoredMessage = {
      _id: new Types.ObjectId(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      createdAt: new Date(),
    };
    this.messages.push(stored);
    return toDocument(stored);
  }
}

function isOlderThanCursor(message: StoredMessage, cursor: DecodedCursor): boolean {
  const byDate = message.createdAt.getTime() - cursor.createdAt.getTime();
  if (byDate !== 0) {
    return byDate < 0;
  }
  return message._id.toString() < cursor.id.toString();
}

function byCreatedAtDesc(a: StoredMessage, b: StoredMessage): number {
  const byDate = b.createdAt.getTime() - a.createdAt.getTime();
  return byDate !== 0 ? byDate : b._id.toString().localeCompare(a._id.toString());
}

function toDocument(stored: StoredMessage): MessageDocument {
  return { ...stored } as MessageDocument;
}
