import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Source reference stored on a tutor message. Embedded subdocument (no own _id).
@Schema({ _id: false })
export class MessageCitation {
  @Prop({ required: true })
  chunkId: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  documentName: string;

  @Prop({ required: true })
  snippet: string;

  @Prop({ required: true })
  score: number;
}

const MessageCitationSchema = SchemaFactory.createForClass(MessageCitation);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Message {
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  senderId: string;

  // Present only on tutor messages; omitted entirely for normal chat messages.
  @Prop({ type: [MessageCitationSchema], default: undefined })
  citations?: MessageCitation[];

  // This will be auto-filled by timestamps
  @Prop()
  createdAt: Date;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });