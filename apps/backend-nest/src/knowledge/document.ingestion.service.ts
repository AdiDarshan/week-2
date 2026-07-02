import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { createHash } from 'node:crypto';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { DocumentsService, type CreateDocumentInput } from './documents.service';
import { ChunksService, type CreateChunkInput } from './chunks.service';
import { EmptyDocumentError } from './knowledge.errors';
import type { KnowledgeDocumentDocument } from './schemas/document.schema';
import type { TextChunk } from './types';

export interface IngestDocumentInput {
  userId: string;
  conversationId: string;
  name: string;
  mimeType: string;
  content: string;
}

export interface IngestionResult {
  id: string;
  name: string;
  alreadyExisted: boolean;
}

@Injectable()
export class DocumentIngestionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly documents: DocumentsService,
    private readonly chunks: ChunksService,
  ) {}

  async ingest(input: IngestDocumentInput): Promise<IngestionResult> {
    const contentHash = hashContent(input.content);

    const existing = await this.documents.findByContentHash(
      input.userId,
      contentHash,
    );
    if (existing) {
      await this.documents.linkToConversation(
        input.userId,
        existing._id.toString(),
        input.conversationId,
      );
      return toResult(existing, true);
    }

    const chunks = this.chunking.chunkText(input.content);
    if (chunks.length === 0) {
      throw new EmptyDocumentError(input.name);
    }

    const embeddings = await this.embedding.embed(
      chunks.map((chunk) => chunk.content),
    );

    const document = await this.store(input, contentHash, chunks, embeddings);
    return toResult(document, false);
  }

  private async store(
    input: IngestDocumentInput,
    contentHash: string,
    chunks: TextChunk[],
    embeddings: number[][],
  ): Promise<KnowledgeDocumentDocument> {
    const session = await this.connection.startSession();
    let document: KnowledgeDocumentDocument;
    try {
      await session.withTransaction(async () => {
        const documentInput: CreateDocumentInput = {
          userId: input.userId,
          name: input.name,
          mimeType: input.mimeType,
          contentHash,
        };
        document = await this.documents.insert(documentInput, session);

        const chunkInputs: CreateChunkInput[] = chunks.map((chunk, index) => ({
          userId: input.userId,
          documentId: document._id.toString(),
          documentName: input.name,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          embedding: embeddings[index],
        }));
        await this.chunks.insert(chunkInputs, session);

        await this.documents.linkToConversation(
          input.userId,
          document._id.toString(),
          input.conversationId,
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    return document!;
  }
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function toResult(
  document: KnowledgeDocumentDocument,
  alreadyExisted: boolean,
): IngestionResult {
  return {
    id: document._id.toString(),
    name: document.name,
    alreadyExisted,
  };
}
