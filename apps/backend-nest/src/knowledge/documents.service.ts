import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { DocumentsDbService } from './documents.db.service';
import type { CreateDocumentInput } from './documents.db.service';
import { DocumentLinksDbService } from './document.links.db.service';
import { ChunksService } from './chunks.service';
import { DocumentNotFoundError } from './knowledge.errors';
import type { KnowledgeDocumentDocument } from './schemas/document.schema';
import type { KnowledgeDocumentLinkDocument } from './schemas/document.link.schema';
import type { DocumentSummary } from './types';

export type { CreateDocumentInput } from './documents.db.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly documentsDb: DocumentsDbService,
    private readonly links: DocumentLinksDbService,
    private readonly chunks: ChunksService,
  ) {}

  insert(
    input: CreateDocumentInput,
    session?: ClientSession,
  ): Promise<KnowledgeDocumentDocument> {
    return this.documentsDb.insertDocument(input, session);
  }

  findByContentHash(
    userId: string,
    contentHash: string,
  ): Promise<KnowledgeDocumentDocument | null> {
    return this.documentsDb.findByContentHash(userId, contentHash);
  }

  linkToConversation(
    userId: string,
    documentId: string,
    conversationId: string,
    session?: ClientSession,
  ): Promise<KnowledgeDocumentLinkDocument> {
    return this.links.upsertLink(
      { userId, documentId, conversationId },
      session,
    );
  }

  documentIdsFor(userId: string, conversationId: string): Promise<string[]> {
    return this.links.findDocumentIds(userId, conversationId);
  }

  async list(
    userId: string,
    conversationId: string,
  ): Promise<DocumentSummary[]> {
    const documentIds = await this.documentIdsFor(userId, conversationId);
    const documents = await this.documentsDb.findByIds(userId, documentIds);
    return documents.map(toSummary);
  }

  async delete(
    userId: string,
    conversationId: string,
    id: string,
  ): Promise<boolean> {
    const session = await this.connection.startSession();
    try {
      let storageFreed = false;
      await session.withTransaction(async () => {
        const unlinked = await this.links.deleteLink(
          { userId, documentId: id, conversationId },
          session,
        );
        if (!unlinked) {
          throw new DocumentNotFoundError(id);
        }

        const remainingLinks = await this.links.countByDocument(id, session);
        if (remainingLinks > 0) {
          return;
        }

        await this.documentsDb.deleteById(userId, id, session);
        await this.chunks.deleteByDocument(userId, id, session);
        storageFreed = true;
      });
      return storageFreed;
    } finally {
      await session.endSession();
    }
  }
}

function toSummary(document: KnowledgeDocumentDocument): DocumentSummary {
  return {
    id: document._id.toString(),
    name: document.name,
    mimeType: document.mimeType,
    createdAt: document.createdAt.toISOString(),
  };
}
