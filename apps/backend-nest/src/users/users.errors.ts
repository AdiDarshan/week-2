import {
  DomainError,
  DomainErrorCategory,
} from '../common/errors/domain.error';

export class EmailAlreadyExistsError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';

  constructor(public readonly email: string) {
    super('email already in use');
  }
}

export class UserNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';

  constructor(public readonly id: string) {
    super(`user "${id}" not found`);
  }
}

export class InvalidUserIdError extends DomainError {
  readonly category: DomainErrorCategory = 'BAD_REQUEST';

  constructor(public readonly id: string) {
    super(`"${id}" is not a valid user id`);
  }
}
