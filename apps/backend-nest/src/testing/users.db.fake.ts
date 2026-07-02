import { Types } from 'mongoose';
import type { UsersDbService, CreateUserInput } from '../users/users.db.service';
import type { UserDocument } from '../users/schemas/user.schema';
import { DuplicateKeyError } from '../common/errors/persistence.error';
import { InvalidUserIdError } from '../users/users.errors';

type StoredUser = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
};

export class UsersDbFake
  implements Pick<UsersDbService, 'insertUser' | 'findUserById' | 'findUserByEmail' | 'listUsers'>
{
  private readonly users: StoredUser[] = [];

  async insertUser(input: CreateUserInput): Promise<UserDocument> {
    if (this.users.some((user) => user.email === input.email)) {
      throw new DuplicateKeyError();
    }
    const stored: StoredUser = { _id: new Types.ObjectId(), ...input };
    this.users.push(stored);
    return toDocument(stored);
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidUserIdError(id);
    }
    const found = this.users.find((user) => user._id.toString() === id);
    return found ? toDocument(found) : null;
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const found = this.users.find((user) => user.email === email);
    return found ? toDocument(found) : null;
  }

  async listUsers(): Promise<UserDocument[]> {
    return this.users.map(toDocument);
  }
}

function toDocument(stored: StoredUser): UserDocument {
  return { ...stored } as UserDocument;
}
