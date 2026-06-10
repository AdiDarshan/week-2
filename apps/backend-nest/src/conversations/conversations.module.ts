import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsDbService } from './conversations-db.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsDbService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
