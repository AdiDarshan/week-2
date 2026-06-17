import {
  DomainError,
  DomainErrorCategory,
} from '../common/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly category: DomainErrorCategory = 'UNAUTHENTICATED';

  constructor() {
    super('invalid credentials');
  }
}
