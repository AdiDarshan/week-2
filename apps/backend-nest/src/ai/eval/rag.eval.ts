import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { TUTOR_CONVERSATION_TYPE } from '../../conversations/types';
import { DocumentIngestionService } from '../../knowledge/document.ingestion.service';
import { DocumentsService } from '../../knowledge/documents.service';
import { RetrievalService } from '../../knowledge/retrieval.service';
import { TutorService } from '../tutor/tutor.service';

interface EvalDocument {
  name: string;
  content: string;
}

interface EvalQuestion {
  id: string;
  question: string;
  expectedDocument: string | null;
  expectedAnswerKeywords: string[];
}

interface EvalCases {
  documents: EvalDocument[];
  questions: EvalQuestion[];
}

interface QuestionResult {
  id: string;
  inKnowledgeBase: boolean;
  retrievedExpected: boolean;
  topScore: number;
  keywordsCovered: number;
  keywordsTotal: number;
  hasCitations: boolean;
  groundingCorrect: boolean;
  answer: string;
}

const INDEX_POLL_ATTEMPTS = 15;
const INDEX_POLL_DELAY_MS = 2000;
const ANSWER_PREVIEW_CHARS = 80;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const cases = JSON.parse(
    readFileSync(join(__dirname, 'rag.eval.cases.json'), 'utf8'),
  ) as EvalCases;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get(UsersService, { strict: false });
    const conversations = app.get(ConversationsService, { strict: false });
    const documents = app.get(DocumentsService, { strict: false });
    const ingestion = app.get(DocumentIngestionService, { strict: false });
    const retrieval = app.get(RetrievalService, { strict: false });
    const tutor = app.get(TutorService, { strict: false });

    const user = await users.createUser(
      `rag-eval+${Date.now()}@example.com`,
      'rag-eval-password',
      'RAG Eval',
    );
    // Knowledge bases are scoped per tutor conversation, so the eval runs
    // inside one just like the app does.
    const conversation = await conversations.createConversation({
      creator: user,
      participantIds: [],
      type: TUTOR_CONVERSATION_TYPE,
    });

    for (const document of cases.documents) {
      await ingestion.ingest({
        userId: user.id,
        conversationId: conversation.id,
        name: document.name,
        mimeType: 'text/markdown',
        content: document.content,
      });
    }
    const documentIds = await documents.documentIdsFor(
      user.id,
      conversation.id,
    );
    await waitForIndex(retrieval, cases.questions, user.id, documentIds);

    const results: QuestionResult[] = [];
    for (const question of cases.questions) {
      results.push(
        await evaluateQuestion(retrieval, tutor, question, {
          userId: user.id,
          conversationId: conversation.id,
          documentIds,
        }),
      );
    }

    printReport(results);
  } finally {
    await app.close();
  }
}

interface EvalScope {
  userId: string;
  conversationId: string;
  documentIds: string[];
}

async function waitForIndex(
  retrieval: RetrievalService,
  questions: EvalQuestion[],
  userId: string,
  documentIds: string[],
): Promise<void> {
  const probe = questions.find((q) => q.expectedDocument !== null);
  if (!probe) {
    return;
  }
  for (let attempt = 0; attempt < INDEX_POLL_ATTEMPTS; attempt++) {
    const chunks = await retrieval.retrieve(probe.question, userId, documentIds);
    if (chunks.length > 0) {
      return;
    }
    await delay(INDEX_POLL_DELAY_MS);
  }
}

async function evaluateQuestion(
  retrieval: RetrievalService,
  tutor: TutorService,
  question: EvalQuestion,
  scope: EvalScope,
): Promise<QuestionResult> {
  const inKnowledgeBase = question.expectedDocument !== null;

  const retrieved = await retrieval.retrieve(
    question.question,
    scope.userId,
    scope.documentIds,
  );
  const retrievedExpected =
    inKnowledgeBase &&
    retrieved.some((chunk) => chunk.documentName === question.expectedDocument);

  const { stream, citations } = await tutor.answer(
    question.question,
    scope.userId,
    scope.conversationId,
  );
  let answer = '';
  for await (const token of stream) {
    answer += token;
  }
  const answerLower = answer.toLowerCase();

  const keywordsCovered = question.expectedAnswerKeywords.filter((keyword) =>
    answerLower.includes(keyword.toLowerCase()),
  ).length;

  const hasCitations = citations.length > 0;
  // In-KB answers must be grounded (cited); out-of-KB must refuse (no citations).
  const groundingCorrect = inKnowledgeBase ? hasCitations : !hasCitations;

  return {
    id: question.id,
    inKnowledgeBase,
    retrievedExpected,
    topScore: retrieved[0]?.score ?? 0,
    keywordsCovered,
    keywordsTotal: question.expectedAnswerKeywords.length,
    hasCitations,
    groundingCorrect,
    answer: answer.trim(),
  };
}

function printReport(results: QuestionResult[]): void {
  const inKb = results.filter((r) => r.inKnowledgeBase);
  const outOfKb = results.filter((r) => !r.inKnowledgeBase);

  console.log('\n─── PER-QUESTION ───');
  for (const r of results) {
    const retrieval = r.inKnowledgeBase ? (r.retrievedExpected ? '✓' : '✗') : '–';
    const coverage = r.inKnowledgeBase
      ? `${r.keywordsCovered}/${r.keywordsTotal}`
      : '–';
    const grounding = r.groundingCorrect ? '✓' : '✗';
    const preview = r.answer.slice(0, ANSWER_PREVIEW_CHARS).replace(/\n/g, ' ');
    const score = r.topScore.toFixed(3);
    console.log(
      `[${r.id}] retrieved:${retrieval} top:${score} keywords:${coverage} grounding:${grounding} | ${preview}`,
    );
  }

  const recall = ratio(inKb.filter((r) => r.retrievedExpected).length, inKb.length);
  const fullyCovered = inKb.filter(
    (r) => r.keywordsCovered === r.keywordsTotal,
  ).length;
  const coverage = ratio(fullyCovered, inKb.length);
  const inKbGrounded = ratio(
    inKb.filter((r) => r.hasCitations).length,
    inKb.length,
  );
  const oobRefused = ratio(
    outOfKb.filter((r) => !r.hasCitations).length,
    outOfKb.length,
  );

  console.log('\n─── SUMMARY ───');
  console.log(`Retrieval recall@K (expected doc in top-K): ${recall}`);
  console.log(`Answer coverage (all keywords present):     ${coverage}`);
  console.log(`In-KB answers grounded (cited):             ${inKbGrounded}`);
  console.log(`Out-of-KB answers correctly refused:        ${oobRefused}`);
}

function ratio(hits: number, total: number): string {
  if (total === 0) {
    return 'n/a';
  }
  return `${hits}/${total} (${Math.round((hits / total) * 100)}%)`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
