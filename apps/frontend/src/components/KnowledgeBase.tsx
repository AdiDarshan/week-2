import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useDocuments } from '../hooks/useDocuments';

type KnowledgeBaseProps = {
  conversationId: string;
};

export function KnowledgeBase({ conversationId }: KnowledgeBaseProps) {
  const { documents, isLoading, isUploading, error, upload, remove } =
    useDocuments(conversationId);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await upload(file);
    }
    // Reset so re-selecting the same file fires onChange again.
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <aside className="knowledge-base">
      <h2 className="knowledge-base-title">Knowledge Base</h2>

      <div className="knowledge-upload">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={handleFileChange}
          disabled={isUploading}
          aria-label="Upload a text or markdown document"
        />
        {isUploading && <span className="knowledge-hint">Uploading…</span>}
      </div>

      {error && (
        <p role="alert" className="knowledge-error">
          {error}
        </p>
      )}

      {isLoading && <div className="placeholder">Loading documents…</div>}

      {!isLoading && documents.length === 0 && (
        <div className="placeholder">No documents yet.</div>
      )}

      {documents.length > 0 && (
        <ul className="knowledge-documents">
          {documents.map((document) => (
            <li key={document.id}>
              <span className="knowledge-document-name">{document.name}</span>
              <button
                type="button"
                className="knowledge-document-delete"
                onClick={() => remove(document.id)}
                aria-label={`Delete ${document.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
