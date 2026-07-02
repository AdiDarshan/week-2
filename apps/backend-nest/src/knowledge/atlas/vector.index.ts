import {
  CHUNK_DOCUMENT_ID_FIELD,
  CHUNK_EMBEDDING_FIELD,
  CHUNK_USER_ID_FIELD,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_SIMILARITY,
  VECTOR_INDEX_NAME,
} from '../knowledge.constants';

interface VectorField {
  type: 'vector';
  path: string;
  numDimensions: number;
  similarity: string;
}

interface FilterField {
  type: 'filter';
  path: string;
}

export interface VectorSearchIndex {
  name: string;
  type: 'vectorSearch';
  definition: { fields: Array<VectorField | FilterField> };
}

export const KNOWLEDGE_CHUNK_VECTOR_INDEX: VectorSearchIndex = {
  name: VECTOR_INDEX_NAME,
  type: 'vectorSearch',
  definition: {
    fields: [
      {
        type: 'vector',
        path: CHUNK_EMBEDDING_FIELD,
        numDimensions: EMBEDDING_DIMENSIONS,
        similarity: EMBEDDING_SIMILARITY,
      },
      { type: 'filter', path: CHUNK_USER_ID_FIELD },
      { type: 'filter', path: CHUNK_DOCUMENT_ID_FIELD },
    ],
  },
};
