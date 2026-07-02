import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CONVERSATION_TYPES } from '../types';
import type { ConversationType } from '../types';

const DEFAULT_CONVERSATION_TYPE: ConversationType = 'human';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Conversation {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: String,
    required: true,
    enum: CONVERSATION_TYPES,
    default: DEFAULT_CONVERSATION_TYPE,
  })
  type: ConversationType;

  @Prop({ type: [String], required: true })
  participantIds: string[];

  @Prop({ required: true })
  lastMessageAt: Date;

  // Filled in by timestamps
  @Prop()
  createdAt: Date;
}

export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
