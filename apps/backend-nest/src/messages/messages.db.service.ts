import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, QueryFilter, Types } from 'mongoose';
import type { MessageDocument } from './schemas/message.schema';
import { Message } from './schemas/message.schema';

export type DecodedCursor = {
  createdAt: Date;
  id: Types.ObjectId;
};

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
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
        { createdAt: { $gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $gt: cursor.id } },
      ];
    }

    const docs = await this.messageModel
      .find(findFilter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const messages = hasMore ? docs.slice(0, limit) : docs;

    return { messages, hasMore };
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
        },
      ],
      { session },
    );
    return doc;
  }

}
