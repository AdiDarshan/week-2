import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { hashPassword } from '../common/password.utils';
import { normalizeEmail } from './email.utils';
import { UsersDbService } from './users.db.service';
import type { RegisteredUser, User } from './types';

@Injectable()
export class UsersService {
  constructor(private readonly usersDb: UsersDbService) {}

  async createUser(
    email: string,
    password: string,
    name: string,
  ): Promise<RegisteredUser> {
    const user: RegisteredUser = {
      id: randomUUID(),
      email: normalizeEmail(email),
      name,
      passwordHash: await hashPassword(password),
    };
    this.usersDb.insertUser(user);
    return user;
  }

  findByEmail(email: string): RegisteredUser | undefined {
    return this.usersDb.findUserByEmail(normalizeEmail(email));
  }

  findById(id: string): RegisteredUser | undefined {
    return this.usersDb.findUserById(id);
  }

  getUsers(): User[] {
    return this.usersDb.getUsers();
  }
}
