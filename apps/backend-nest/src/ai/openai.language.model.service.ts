import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type {
  ChatMessage,
  ILanguageModelService,
  ToolCall,
  ToolDefinition,
  TurnEvent,
} from './language.model.service.interface';

const OPENAI_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 1024;

@Injectable()
export class OpenAiLanguageModelService implements ILanguageModelService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
  }

  async *streamTurn(
    systemPrompt: string,
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): AsyncIterable<TurnEvent> {
    const openAiStream = await this.openStream(systemPrompt, messages, tools);
    const toolCalls: ToolCall[] = [];

    for await (const chunk of openAiStream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) {
        continue;
      }

      if (delta.content) {
        yield { type: 'text', value: delta.content };
      }

      for (const part of delta.tool_calls ?? []) {
        accumulateToolCallDelta(toolCalls, part);
      }
    }

    if (toolCalls.length > 0) {
      yield { type: 'tool_calls', calls: toolCalls };
    }
  }

  private async openStream(
    systemPrompt: string,
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ) {
    return this.client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(toOpenAiMessage),
      ],
      tools: tools.length > 0 ? tools.map(toOpenAiTool) : undefined,
    });
  }

}

function accumulateToolCallDelta(
  toolCalls: ToolCall[],
  part: ChatCompletionChunk.Choice.Delta.ToolCall,
): void {
  const call = (toolCalls[part.index] ??= { id: '', name: '', arguments: '' });
  if (part.id) {
    call.id = part.id;
  }
  if (part.function?.name) {
    call.name = part.function.name;
  }
  if (part.function?.arguments) {
    call.arguments += part.function.arguments;
  }
}

function toOpenAiTool(tool: ToolDefinition): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

function toOpenAiMessage(message: ChatMessage): ChatCompletionMessageParam {
  switch (message.role) {
    case 'user':
      return { role: 'user', content: message.content };
    case 'tool':
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: message.content,
      };
    case 'assistant':
      if ('toolCalls' in message) {
        return {
          role: 'assistant',
          content: null,
          tool_calls: message.toolCalls.map((call) => ({
            id: call.id,
            type: 'function',
            function: { name: call.name, arguments: call.arguments },
          })),
        };
      }
      return { role: 'assistant', content: message.content };
  }
}
