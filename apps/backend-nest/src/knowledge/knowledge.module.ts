import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DocumentsModule } from './documents.module';
import { ChunksModule } from './chunks.module';
import { KnowledgeDocumentsController } from './knowledge.documents.controller';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { RetrievalService } from './retrieval.service';
import { DocumentIngestionService } from './document.ingestion.service';

@Module({
  imports: [DocumentsModule, ChunksModule, ConversationsModule],
  controllers: [KnowledgeDocumentsController],
  providers: [
    ChunkingService,
    EmbeddingService,
    RetrievalService,
    DocumentIngestionService,
  ],
  exports: [RetrievalService, DocumentsModule],
})
export class KnowledgeModule {}
