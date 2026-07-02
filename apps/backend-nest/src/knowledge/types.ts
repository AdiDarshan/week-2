
export interface TextChunk {
  content: string;
  chunkIndex: number;
}

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  snippet: string;
  score: number;
}

export interface DocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  createdAt: string;
}
