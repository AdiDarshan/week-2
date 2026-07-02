import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';
import { DOCUMENT_LINKS_COLLECTION } from '../knowledge.constants';

@Schema({
  collection: DOCUMENT_LINKS_COLLECTION,
  timestamps: { createdAt: true, updatedAt: false },
})
export class KnowledgeDocumentLink {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  conversationId: string;

  @Prop()
  createdAt: Date;
}

export type KnowledgeDocumentLinkDocument = KnowledgeDocumentLink &
  MongoDocument;
export const KnowledgeDocumentLinkSchema = SchemaFactory.createForClass(
  KnowledgeDocumentLink,
);

KnowledgeDocumentLinkSchema.index(
  { documentId: 1, conversationId: 1 },
  { unique: true },
);
KnowledgeDocumentLinkSchema.index({ userId: 1, conversationId: 1 });
