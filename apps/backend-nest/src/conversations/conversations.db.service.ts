import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import type { ConversationDocument } from './schemas/conversation.schema';
import { Conversation } from './schemas/conversation.schema';
import { InvalidConversationIdError } from './conversations.errors';
export type CreateConversationInput = {
  title: string;
  participantIds: string[];
  lastMessageAt: Date;
};

@Injectable()
export class ConversationsDbService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async listConversationsForUser(
    userId: string,
  ): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participantIds: userId })
      .sort({ lastMessageAt: -1, _id: -1 })
      .exec();
  }

  async findConversationById(
    id: string,
  ): Promise<ConversationDocument | null> {
    this.assertValidId(id);
    return this.conversationModel.findById(id).exec();
  }

  async insertConversation(
    input: CreateConversationInput,
  ): Promise<ConversationDocument> {
    return this.conversationModel.create(input);
  }

  async updateLastMessageAt(
    id: string,
    lastMessageAt: Date,
    session?: ClientSession,
  ): Promise<ConversationDocument | null> {
    this.assertValidId(id);
    return this.conversationModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { lastMessageAt } },
        { new: true, session },
      )
      .exec();
  }

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidConversationIdError(id);
    }
  }
}
