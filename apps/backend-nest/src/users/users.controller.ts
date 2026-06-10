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
  listUsers(@CurrentUser() user: User): User[] {
    return this.usersService.getUsers().filter((u) => u.id !== user.id);
  }
}
