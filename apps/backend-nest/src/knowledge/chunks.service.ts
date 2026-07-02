import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ChunksDbService } from './chunks.db.service';
import type { CreateChunkInput } from './chunks.db.service';
import type { KnowledgeChunkDocument } from './schemas/chunk.schema';
import type { RetrievedChunk } from './types';

export type { CreateChunkInput } from './chunks.db.service';

@Injectable()
export class ChunksService {
  constructor(private readonly chunksDb: ChunksDbService) {}

  insert(
    chunks: CreateChunkInput[],
    session?: ClientSession,
  ): Promise<KnowledgeChunkDocument[]> {
    return this.chunksDb.insertChunks(chunks, session);
  }

  search(
    queryVector: number[],
    userId: string,
    documentIds: string[],
    limit: number,
  ): Promise<RetrievedChunk[]> {
    return this.chunksDb.vectorSearch(queryVector, userId, documentIds, limit);
  }

  deleteByDocument(
    userId: string,
    documentId: string,
    session?: ClientSession,
  ): Promise<number> {
    return this.chunksDb.deleteByDocument(userId, documentId, session);
  }
}
