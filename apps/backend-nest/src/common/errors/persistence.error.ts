export class DuplicateKeyError extends Error {
  constructor(message = 'duplicate key') {
    super(message);
    this.name = new.target.name;
  }
}
