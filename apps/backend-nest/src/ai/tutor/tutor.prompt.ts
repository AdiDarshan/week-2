import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { RetrievedChunk } from '../../knowledge/types';

const TUTOR_SYSTEM_PROMPT = `You are a study tutor helping a student with their own uploaded documents. The context below contains excerpts from those documents.

How to answer:
- If the student asks what a document says, what is in a file, or for a summary or overview ("what is written in the file?", "what does my document say?"), treat it as a request to summarize the context. Summarize the excerpts below directly — this is always answerable when context is present.
- For factual questions, answer using ONLY facts found in the context. Never use outside knowledge.
- Say you could not find it in their documents ONLY when the context contains nothing related to the question. A summary request is never "not found" if any context is present.
- Do not guess or invent facts beyond the context. Be concise and clear.

Context:
{context}`;

export function buildTutorPrompt(): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    ['system', TUTOR_SYSTEM_PROMPT],
    ['human', '{question}'],
  ]);
}

export function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] (from "${chunk.documentName}")\n${chunk.content}`,
    )
    .join('\n\n');
}
