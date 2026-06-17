import { Injectable } from '@nestjs/common';
import { hashPassword } from '../common/password.utils';
import { UsersDbService } from './users.db.service';
import { EmailAlreadyExistsError } from './users.errors';
import { DuplicateKeyError } from '../common/errors/persistence.error';
import type { UserDocument } from './schemas/user.schema';
import type { RegisteredUser, User } from './types';

@Injectable()
export class UsersService {
  constructor(private readonly usersDb: UsersDbService) {}

  async createUser(
    email: string,
    password: string,
    name: string,
  ): Promise<RegisteredUser> {
    try {
      const doc = await this.usersDb.insertUser({
        email,
        name,
        passwordHash: await hashPassword(password),
      });
      return toRegisteredUser(doc);
    } catch (error) {
      if (error instanceof DuplicateKeyError) {
        throw new EmailAlreadyExistsError(email);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<RegisteredUser | undefined> {
    const doc = await this.usersDb.findUserByEmail(email);
    return doc ? toRegisteredUser(doc) : undefined;
  }

  async findById(id: string): Promise<RegisteredUser | undefined> {
    const doc = await this.usersDb.findUserById(id);
    return doc ? toRegisteredUser(doc) : undefined;
  }

  async getUsers(): Promise<User[]> {
    const docs = await this.usersDb.listUsers();
    return docs.map(toUser);
  }
}

function toUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
  };
}

function toRegisteredUser(doc: UserDocument): RegisteredUser {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
  };
}
