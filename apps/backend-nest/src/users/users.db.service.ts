import { Injectable } from '@nestjs/common';
import { EmailAlreadyExistsError } from './users.errors';
import type { RegisteredUser, User } from './types';

@Injectable()
export class UsersDbService {
  private readonly users: RegisteredUser[] = [];

  insertUser(user: RegisteredUser): void {
    if (this.users.some((existing) => existing.email === user.email)) {
      throw new EmailAlreadyExistsError(user.email);
    }
    this.users.push(user);
  }

  findUserById(id: string): RegisteredUser | undefined {
    return this.users.find((user) => user.id === id);
  }

  findUserByEmail(email: string): RegisteredUser | undefined {
    return this.users.find((user) => user.email === email);
  }

  getUsers(): User[] {
    return this.users.map(({ id, name }) => ({ id, name }));
  }
}
