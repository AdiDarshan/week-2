import { apiRequest } from './client';
import type {
  DocumentSummaryDto,
  IngestionResultDto,
  KnowledgeDocument,
  UploadDocumentRequestDto,
} from './types';

function documentsPath(conversationId: string): string {
  return `/knowledge/conversations/${encodeURIComponent(conversationId)}/documents`;
}

function fromDocumentDto(dto: DocumentSummaryDto): KnowledgeDocument {
  return { ...dto, createdAt: new Date(dto.createdAt) };
}

export async function listDocuments(
  token: string,
  conversationId: string,
): Promise<KnowledgeDocument[]> {
  const dtos = await apiRequest<DocumentSummaryDto[]>(
    documentsPath(conversationId),
    { token },
  );
  return dtos.map(fromDocumentDto);
}

export async function uploadDocument(
  token: string,
  conversationId: string,
  body: UploadDocumentRequestDto,
): Promise<IngestionResultDto> {
  return apiRequest<IngestionResultDto>(documentsPath(conversationId), {
    method: 'POST',
    token,
    body,
  });
}

export async function deleteDocument(
  token: string,
  conversationId: string,
  id: string,
): Promise<void> {
  await apiRequest<void>(
    `${documentsPath(conversationId)}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}
