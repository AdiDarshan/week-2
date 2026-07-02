import { Injectable } from '@nestjs/common';
import { MessagesService } from '../../messages/messages.service';
import { RetrievalService } from '../../knowledge/retrieval.service';
import { DocumentsService } from '../../knowledge/documents.service';
import { toCitations } from '../../knowledge/citations.mapper';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../../common/constants';
import { TutorLanguageModelService } from './tutor.language.model.service';
import type { Citation } from '../../knowledge/types';
import type { Message } from '../../messages/types';
import type { GenerateReplyInput } from '../types';

const LATEST_MESSAGE_LIMIT = 1;
const NO_DOCUMENTS_REPLY =
  'This chat has no documents yet. Upload a document to its knowledge base to get started, then ask me about it.';
const NO_MATCH_REPLY =
  'I could not find anything about that in your uploaded documents.';

export interface TutorAnswer {
  citations: Citation[];
  stream: AsyncGenerator<string>;
}

@Injectable()
export class TutorService {
  constructor(
    private readonly retrieval: RetrievalService,
    private readonly languageModel: TutorLanguageModelService,
    private readonly documents: DocumentsService,
    private readonly messagesService: MessagesService,
  ) {}

  async *generateReply(
    input: GenerateReplyInput,
  ): AsyncGenerator<string, Message> {
    const question = await this.fetchLatestUserQuestion(
      input.conversationId,
      input.userId,
    );
    const { stream, citations } = await this.answer(
      question,
      input.userId,
      input.conversationId,
    );

    let fullReply = '';
    for await (const token of stream) {
      fullReply += token;
      yield token;
    }

    return this.messagesService.createMessage({
      conversationId: input.conversationId,
      senderId: AI_ASSISTANT_PARTICIPANT_ID,
      content: fullReply,
      citations,
    });
  }

  async answer(
    question: string,
    userId: string,
    conversationId: string,
  ): Promise<TutorAnswer> {
    const documentIds = await this.documents.documentIdsFor(
      userId,
      conversationId,
    );
    if (documentIds.length === 0) {
      return { citations: [], stream: singleMessage(NO_DOCUMENTS_REPLY) };
    }

    const chunks = await this.retrieval.retrieve(
      question,
      userId,
      documentIds,
    );
    if (chunks.length === 0) {
      return { citations: [], stream: singleMessage(NO_MATCH_REPLY) };
    }

    return {
      citations: toCitations(chunks),
      stream: this.languageModel.streamAnswer(question, chunks),
    };
  }

  private async fetchLatestUserQuestion(
    conversationId: string,
    userId: string,
  ): Promise<string> {
    const { messages } = await this.messagesService.getMessagesPage({
      conversationId,
      requesterId: userId,
      limit: LATEST_MESSAGE_LIMIT,
    });
    const [latest] = messages;
    return latest && latest.senderId !== AI_ASSISTANT_PARTICIPANT_ID
      ? latest.content
      : '';
  }
}

async function* singleMessage(message: string): AsyncGenerator<string> {
  yield message;
}
