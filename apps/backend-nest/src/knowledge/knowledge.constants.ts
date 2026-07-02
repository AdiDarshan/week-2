
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

export const EMBEDDING_SIMILARITY = 'cosine';

export const CHUNKS_COLLECTION = 'knowledge_chunks';
export const DOCUMENT_LINKS_COLLECTION = 'knowledge_document_links';
export const VECTOR_INDEX_NAME = 'knowledge_chunk_vector_index';

export const CHUNK_EMBEDDING_FIELD = 'embedding';
export const CHUNK_USER_ID_FIELD = 'userId';
export const CHUNK_DOCUMENT_ID_FIELD = 'documentId';

export const VECTOR_NUM_CANDIDATES = 100;

export const SUPPORTED_MIME_TYPES = ['text/plain', 'text/markdown'] as const;
