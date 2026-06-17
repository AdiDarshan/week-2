import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Conversation {
  @Prop({ required: true })
  title: string;

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
