import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  KnowledgeDocument,
  KnowledgeDocumentSchema,
} from './schemas/document.schema';
import {
  KnowledgeDocumentLink,
  KnowledgeDocumentLinkSchema,
} from './schemas/document.link.schema';
import { DocumentsDbService } from './documents.db.service';
import { DocumentLinksDbService } from './document.links.db.service';
import { DocumentsService } from './documents.service';
import { ChunksModule } from './chunks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeDocument.name, schema: KnowledgeDocumentSchema },
      {
        name: KnowledgeDocumentLink.name,
        schema: KnowledgeDocumentLinkSchema,
      },
    ]),
    ChunksModule,
  ],
  providers: [DocumentsDbService, DocumentLinksDbService, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
