import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class KnowledgeDocument {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  contentHash: string;

  // This will be auto-filled by timestamps
  @Prop()
  createdAt: Date;
}

export type KnowledgeDocumentDocument = KnowledgeDocument & MongoDocument;
export const KnowledgeDocumentSchema =
  SchemaFactory.createForClass(KnowledgeDocument);

KnowledgeDocumentSchema.index({ userId: 1, contentHash: 1 }, { unique: true });
