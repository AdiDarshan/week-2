import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { buildTutorPrompt, formatContext } from './tutor.prompt';
import type { RetrievedChunk } from '../../knowledge/types';

const TUTOR_MODEL = 'gpt-4o-mini';
const TUTOR_TEMPERATURE = 0;
const TUTOR_MAX_TOKENS = 1024;

type TutorChainInput = { context: string; question: string };

@Injectable()
export class TutorLanguageModelService {
  private readonly chain: RunnableSequence<TutorChainInput, string>;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const model = new ChatOpenAI({
      apiKey,
      model: TUTOR_MODEL,
      temperature: TUTOR_TEMPERATURE,
      maxTokens: TUTOR_MAX_TOKENS,
    });

    this.chain = RunnableSequence.from([
      buildTutorPrompt(),
      model,
      new StringOutputParser(),
    ]);
  }

  async *streamAnswer(
    question: string,
    chunks: RetrievedChunk[],
  ): AsyncGenerator<string> {
    const context = formatContext(chunks);
    const stream = await this.chain.stream({ context, question });
    for await (const token of stream) {
      yield token;
    }
  }
}
