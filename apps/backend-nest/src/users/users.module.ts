import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersDbService } from './users.db.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersDbService],
  exports: [UsersService],
})
export class UsersModule {}
