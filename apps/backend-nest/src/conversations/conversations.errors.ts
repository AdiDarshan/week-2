import {
  DomainError,
  DomainErrorCategory,
} from '../common/errors/domain.error';

export class ConversationNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';

  constructor(public readonly id: string) {
    super(`conversation "${id}" not found`);
  }
}

export class InvalidConversationIdError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly id: string) {
    super(`"${id}" is not a valid conversation id`);
  }
}

export class NotAConversationParticipantError extends DomainError {
  readonly category: DomainErrorCategory = 'FORBIDDEN';

  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
  ) {
    super(
      `user "${userId}" is not a participant in conversation "${conversationId}"`,
    );
  }
}
