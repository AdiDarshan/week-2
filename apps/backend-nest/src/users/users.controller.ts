import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import { UsersService } from './users.service';
import type { User } from './types';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): User {
    return user;
  }

  @Get()
  async listUsers(@CurrentUser() user: User): Promise<User[]> {
    const users = await this.usersService.getUsers();
    return users.filter((u) => u.id !== user.id);
  }
}
