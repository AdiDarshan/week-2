import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { InvalidCredentialsError } from './auth.errors';
import { hashPassword, verifyPassword } from '../common/password.utils';
import type { LoginResponse } from './types';

const DUMMY_PASSWORD_FOR_CONSTANT_TIME_LOGIN = 'dummy';

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string> = hashPassword(
    DUMMY_PASSWORD_FOR_CONSTANT_TIME_LOGIN,
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    email: string,
    password: string,
    name: string,
  ): Promise<LoginResponse> {
    const user = await this.usersService.createUser(email, password, name);
    return this.issueToken(user.id, user.name);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return this.issueToken(user.id, user.name);
  }

  private issueToken(id: string, name: string): LoginResponse {
    const token = this.jwtService.sign({ sub: id });
    return { token, user: { id, name } };
  }
}
