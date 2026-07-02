import { Injectable } from '@nestjs/common';
import type { TextChunk } from './types';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const CHUNK_STRIDE = CHUNK_SIZE - CHUNK_OVERLAP;

@Injectable()
export class ChunkingService {
  chunkText(content: string): TextChunk[] {
    return splitIntoChunks(content, CHUNK_SIZE, CHUNK_STRIDE);
  }
}

function splitIntoChunks(
  content: string,
  size: number,
  stride: number,
): TextChunk[] {
  const trimmed = content.trim();
  if (trimmed === '') {
    return [];
  }

  const chunks: TextChunk[] = [];
  for (let start = 0, index = 0; start < trimmed.length; start += stride) {
    const end = Math.min(start + size, trimmed.length);
    chunks.push({ content: trimmed.slice(start, end), chunkIndex: index });
    index += 1;
    if (end === trimmed.length) {
      break;
    }
  }
  return chunks;
}
