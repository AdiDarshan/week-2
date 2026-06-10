export type DomainErrorCategory =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT';

export abstract class DomainError extends Error {
  abstract readonly category: DomainErrorCategory;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
