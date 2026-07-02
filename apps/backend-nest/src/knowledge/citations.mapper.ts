import type { Citation, RetrievedChunk } from './types';

export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    snippet: chunk.content,
    score: chunk.score,
  }));
}
