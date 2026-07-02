import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, QueryFilter, Types } from 'mongoose';
import type { MessageDocument } from './schemas/message.schema';
import { Message } from './schemas/message.schema';
import type { Citation } from '../knowledge/types';

export type DecodedCursor = {
  createdAt: Date;
  id: Types.ObjectId;
};

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
  citations?: Citation[];
};

@Injectable()
export class MessagesDbService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findConversationMessages(
    conversationId: string,
    limit: number,
    cursor?: DecodedCursor,
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    const findFilter: QueryFilter<MessageDocument> = { conversationId };

    if (cursor) {
      findFilter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    const docs = await this.messageModel
      .find(findFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    return { messages: hasMore ? docs.slice(0, limit) : docs, hasMore };
  }

  async searchMessagesInConversations(
    conversationIds: string[],
    escapedQuery: string,
    limit: number,
  ): Promise<MessageDocument[]> {
    if (conversationIds.length === 0) {
      return [];
    }

    const findFilter: QueryFilter<MessageDocument> = {
      conversationId: { $in: conversationIds },
      content: { $regex: escapedQuery, $options: 'i' },
    };

    return this.messageModel
      .find(findFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .exec();
  }

  async insertMessage(
    input: CreateMessageInput,
    session?: ClientSession,
  ): Promise<MessageDocument> {
    const [doc] = await this.messageModel.create(
      [
        {
          conversationId: input.conversationId,
          content: input.content,
          senderId: input.senderId,
          citations: input.citations,
        },
      ],
      { session },
    );
    return doc;
  }
}
