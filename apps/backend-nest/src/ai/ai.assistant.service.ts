import { Injectable, Inject } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationNotFoundError } from '../conversations/conversations.errors';
import { ASSISTANT_CONVERSATION_TYPE } from '../conversations/types';
import { LANGUAGE_MODEL_SERVICE } from './language.model.service.interface';
import type {
  ChatMessage,
  ILanguageModelService,
  ToolCall,
} from './language.model.service.interface';
import { ToolRegistryService } from './tool.registry.service';
import { buildSystemPrompt } from './prompts/chat.assistant.prompt';
import { NotAnAssistantConversationError } from './ai.errors';
import { AI_ASSISTANT_PARTICIPANT_ID } from '../common/constants';
import type { Message } from '../messages/types';

const CONVERSATION_HISTORY_LIMIT = 50;
const MAX_TOOL_ROUNDS = 4;
const ASSISTANT_FALLBACK_REPLY = 'Sorry, I could not produce a response.';

export interface GenerateAssistantReplyInput {
  userId: string;
  conversationId: string;
}

@Injectable()
export class AiAssistantService {
  constructor(
    @Inject(LANGUAGE_MODEL_SERVICE)
    private readonly languageModelService: ILanguageModelService,
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  async assertAssistantConversation(conversationId: string): Promise<void> {
    const conversation = await this.conversationsService.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }
    if (conversation.type !== ASSISTANT_CONVERSATION_TYPE) {
      throw new NotAnAssistantConversationError(conversationId);
    }
  }

  async *generateAssistantReply(
    input: GenerateAssistantReplyInput,
  ): AsyncGenerator<string, Message> {
    const messages: ChatMessage[] = await this.fetchHistory(
      input.conversationId,
      input.userId,
    );

    const systemPrompt = buildSystemPrompt();
    let fullReply = '';

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const { text, toolCalls } = yield* this.streamModelTurn(
        systemPrompt,
        messages,
      );
      fullReply += text;

      if (toolCalls.length === 0) {
        break;
      }

      await this.executeToolCalls(messages, toolCalls, input.userId);
    }

    if (fullReply.trim() === '') {
      fullReply = ASSISTANT_FALLBACK_REPLY;
      yield fullReply;
    }

    return this.messagesService.createMessage({
      conversationId: input.conversationId,
      senderId: AI_ASSISTANT_PARTICIPANT_ID,
      content: fullReply,
    });
  }

  private async *streamModelTurn(
    systemPrompt: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string, { text: string; toolCalls: ToolCall[] }> {
    let text = '';
    const toolCalls: ToolCall[] = [];

    for await (const event of this.languageModelService.streamTurn(
      systemPrompt,
      messages,
      this.toolRegistry.getToolDefinitions(),
    )) {
      if (event.type === 'text') {
        text += event.value;
        yield event.value;
      } else {
        toolCalls.push(...event.calls);
      }
    }

    return { text, toolCalls };
  }

  private async executeToolCalls(
    messages: ChatMessage[],
    toolCalls: ToolCall[],
    userId: string,
  ): Promise<void> {
    messages.push({ role: 'assistant', toolCalls });
    const results = await Promise.all(
      toolCalls.map((call) =>
        this.runTool(call, userId).then((content) => ({
          toolCallId: call.id,
          content,
        })),
      ),
    );
    for (const { toolCallId, content } of results) {
      messages.push({ role: 'tool', toolCallId, content });
    }
  }

  private async runTool(call: ToolCall, userId: string): Promise<string> {
    try {
      const result = await this.toolRegistry.callTool(
        call.name,
        call.arguments,
        { userId },
      );
      return JSON.stringify(result);
    } catch {
      return JSON.stringify({ error: `Tool "${call.name}" failed.` });
    }
  }

  private async fetchHistory(
    conversationId: string,
    userId: string,
  ): Promise<ChatMessage[]> {
    const { messages } = await this.messagesService.getMessagesPage({
      conversationId,
      requesterId: userId,
      limit: CONVERSATION_HISTORY_LIMIT,
    });
    return messages.reverse().map(toChatMessage);
  }
}

function toChatMessage(message: Message): ChatMessage {
  return message.senderId === AI_ASSISTANT_PARTICIPANT_ID
    ? { role: 'assistant', content: message.content }
    : { role: 'user', content: message.content };
}
