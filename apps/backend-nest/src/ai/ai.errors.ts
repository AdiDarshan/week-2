import {
  DomainError,
  DomainErrorCategory,
} from '../common/errors/domain.error';

export class UnknownToolError extends Error {
  constructor(toolName: string) {
    super(`Unknown tool "${toolName}"`);
    this.name = 'UnknownToolError';
  }
}

export class NotAnAssistantConversationError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly conversationId: string) {
    super(`conversation "${conversationId}" is not an assistant conversation`);
  }
}
