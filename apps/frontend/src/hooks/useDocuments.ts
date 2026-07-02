import { useCallback, useEffect, useState } from 'react';
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from '../api/knowledge';
import type { KnowledgeDocument } from '../api/types';
import { useAuth } from './useAuth';

const MARKDOWN_EXTENSION = '.md';

function mimeTypeForFile(file: File): string {
  return file.name.toLowerCase().endsWith(MARKDOWN_EXTENSION)
    ? 'text/markdown'
    : 'text/plain';
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function useDocuments(conversationId: string) {
  const { auth } = useAuth();
  const token = auth?.token ?? null;
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    const currentToken = token;
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const docs = await listDocuments(currentToken, conversationId);
        if (!isCancelled) {
          setDocuments(docs);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(messageOf(err));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [token, conversationId]);

  const upload = useCallback(
    async (file: File) => {
      if (!token) {
        return;
      }
      setIsUploading(true);
      setError(null);
      try {
        const content = await file.text();
        await uploadDocument(token, conversationId, {
          name: file.name,
          mimeType: mimeTypeForFile(file),
          content,
        });
        // Re-list so dedup (re-upload) reflects accurately, no local guessing.
        setDocuments(await listDocuments(token, conversationId));
      } catch (err) {
        setError(messageOf(err));
      } finally {
        setIsUploading(false);
      }
    },
    [token, conversationId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) {
        return;
      }
      setError(null);
      try {
        await deleteDocument(token, conversationId, id);
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } catch (err) {
        setError(messageOf(err));
      }
    },
    [token, conversationId],
  );

  return { documents, isLoading, isUploading, error, upload, remove };
}
