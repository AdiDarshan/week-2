import {
  DomainError,
  DomainErrorCategory,
} from '../common/errors/domain.error';

export class InvalidDocumentIdError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly id: string) {
    super(`"${id}" is not a valid document id`);
  }
}

export class DocumentNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';

  constructor(public readonly id: string) {
    super(`document "${id}" not found`);
  }
}

export class EmptyDocumentError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly name: string) {
    super(`document "${name}" has no usable text content`);
  }
}

export class NotATutorConversationError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly conversationId: string) {
    super(
      `conversation "${conversationId}" is not a tutor conversation and has no knowledge base`,
    );
  }
}
