export const LANGUAGE_MODEL_SERVICE = 'LANGUAGE_MODEL_SERVICE';
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface UserMessage {
  role: 'user';
  content: string;
}

export interface AssistantMessage {
  role: 'assistant';
  content: string;
}

export interface AssistantToolCallMessage {
  role: 'assistant';
  toolCalls: ToolCall[];
}

export interface ToolResultMessage {
  role: 'tool';
  toolCallId: string;
  content: string;
}

export type ChatMessage =
  | UserMessage
  | AssistantMessage
  | AssistantToolCallMessage
  | ToolResultMessage;

export type TurnEvent =
  | { type: 'text'; value: string }
  | { type: 'tool_calls'; calls: ToolCall[] };

export interface ILanguageModelService {
  streamTurn(
    systemPrompt: string,
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): AsyncIterable<TurnEvent>;
}
