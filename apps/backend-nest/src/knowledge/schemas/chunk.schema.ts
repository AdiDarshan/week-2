import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CHUNKS_COLLECTION } from '../knowledge.constants';

@Schema({
  collection: CHUNKS_COLLECTION,
  timestamps: { createdAt: true, updatedAt: false },
})
export class KnowledgeChunk {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  documentName: string;

  @Prop({ required: true })
  chunkIndex: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop()
  createdAt: Date;
}

export type KnowledgeChunkDocument = KnowledgeChunk & Document;
export const KnowledgeChunkSchema =
  SchemaFactory.createForClass(KnowledgeChunk);

KnowledgeChunkSchema.index({ userId: 1, documentId: 1 });
