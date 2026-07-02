import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunksService } from './chunks.service';
import type { RetrievedChunk } from './types';

export const DEFAULT_RETRIEVAL_LIMIT = 5;
export const MIN_RELEVANCE_SCORE = 0.62;

@Injectable()
export class RetrievalService {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly chunks: ChunksService,
  ) {}

  async retrieve(
    query: string,
    userId: string,
    documentIds: string[],
  ): Promise<RetrievedChunk[]> {
    if (documentIds.length === 0) {
      return [];
    }
    const [queryVector] = await this.embedding.embed([query]);
    const chunks = await this.chunks.search(
      queryVector,
      userId,
      documentIds,
      DEFAULT_RETRIEVAL_LIMIT,
    );
    return chunks.filter((chunk) => chunk.score >= MIN_RELEVANCE_SCORE);
  }
}
