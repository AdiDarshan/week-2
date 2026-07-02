import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, PipelineStage, Types } from 'mongoose';
import {
  KnowledgeChunk,
  type KnowledgeChunkDocument,
} from './schemas/chunk.schema';
import {
  CHUNK_DOCUMENT_ID_FIELD,
  CHUNK_EMBEDDING_FIELD,
  CHUNK_USER_ID_FIELD,
  VECTOR_INDEX_NAME,
  VECTOR_NUM_CANDIDATES,
} from './knowledge.constants';
import type { RetrievedChunk } from './types';

export type CreateChunkInput = {
  userId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
};

type VectorSearchFilterClause =
  | Record<string, { $eq: string }>
  | Record<string, { $in: string[] }>;

interface VectorSearchStageParams {
  index: string;
  path: string;
  queryVector: number[];
  numCandidates: number;
  limit: number;
  filter: { $and: VectorSearchFilterClause[] };
}

interface VectorSearchRow {
  _id: Types.ObjectId;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}

@Injectable()
export class ChunksDbService {
  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
  ) {}

  async insertChunks(
    chunks: CreateChunkInput[],
    session?: ClientSession,
  ): Promise<KnowledgeChunkDocument[]> {
    if (chunks.length === 0) {
      return [];
    }
    return this.chunkModel.insertMany(chunks, { session });
  }

  async deleteByDocument(
    userId: string,
    documentId: string,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.chunkModel
      .deleteMany({ userId, documentId })
      .session(session ?? null)
      .exec();
    return result.deletedCount;
  }

  async vectorSearch(
    queryVector: number[],
    userId: string,
    documentIds: string[],
    limit: number,
  ): Promise<RetrievedChunk[]> {
    if (documentIds.length === 0) {
      return [];
    }
    const stageParams: VectorSearchStageParams = {
      index: VECTOR_INDEX_NAME,
      path: CHUNK_EMBEDDING_FIELD,
      queryVector,
      numCandidates: VECTOR_NUM_CANDIDATES,
      limit,
      filter: {
        $and: [
          { [CHUNK_USER_ID_FIELD]: { $eq: userId } },
          { [CHUNK_DOCUMENT_ID_FIELD]: { $in: documentIds } },
        ],
      },
    };

    const vectorSearchStage = {
      $vectorSearch: stageParams,
    } as unknown as PipelineStage;

    const rows = await this.chunkModel.aggregate<VectorSearchRow>([
      vectorSearchStage,
      {
        $project: {
          documentId: 1,
          documentName: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return rows.map((row) => ({
      id: row._id.toString(),
      documentId: row.documentId,
      documentName: row.documentName,
      content: row.content,
      score: row.score,
    }));
  }
}
