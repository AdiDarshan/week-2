import { Types } from 'mongoose';
import type {
  ConversationsDbService,
  CreateConversationInput,
} from '../conversations/conversations.db.service';
import type { ConversationDocument } from '../conversations/schemas/conversation.schema';
import { InvalidConversationIdError } from '../conversations/conversations.errors';

type StoredConversation = {
  _id: Types.ObjectId;
  title: string;
  type: CreateConversationInput['type'];
  participantIds: string[];
  lastMessageAt: Date;
};

export class ConversationsDbFake
  implements
    Pick<
      ConversationsDbService,
      | 'listConversationsForUser'
      | 'findConversationById'
      | 'insertConversation'
      | 'updateLastMessageAt'
    >
{
  private readonly conversations: StoredConversation[] = [];

  async listConversationsForUser(
    userId: string,
  ): Promise<ConversationDocument[]> {
    return this.conversations
      .filter((c) => c.participantIds.includes(userId))
      .sort(byLastMessageAtDesc)
      .map(toDocument);
  }

  async findConversationById(id: string): Promise<ConversationDocument | null> {
    this.assertValidId(id);
    const found = this.conversations.find((c) => c._id.toString() === id);
    return found ? toDocument(found) : null;
  }

  async insertConversation(
    input: CreateConversationInput,
  ): Promise<ConversationDocument> {
    const stored: StoredConversation = {
      _id: new Types.ObjectId(),
      ...input,
      participantIds: [...input.participantIds],
    };
    this.conversations.push(stored);
    return toDocument(stored);
  }

  async updateLastMessageAt(
    id: string,
    lastMessageAt: Date,
  ): Promise<ConversationDocument | null> {
    this.assertValidId(id);
    const found = this.conversations.find((c) => c._id.toString() === id);
    if (!found) {
      return null;
    }
    found.lastMessageAt = lastMessageAt;
    return toDocument(found);
  }

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidConversationIdError(id);
    }
  }
}

function byLastMessageAtDesc(
  a: StoredConversation,
  b: StoredConversation,
): number {
  const byDate = b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
  return byDate !== 0 ? byDate : b._id.toString().localeCompare(a._id.toString());
}

function toDocument(stored: StoredConversation): ConversationDocument {
  return { ...stored, participantIds: [...stored.participantIds] } as ConversationDocument;
}
