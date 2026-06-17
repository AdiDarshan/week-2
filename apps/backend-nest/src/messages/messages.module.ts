import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesDbService } from './messages-db.service';
import { UsersModule } from '../users/users.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [UsersModule, ConversationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesDbService],
  exports: [MessagesService],
})
export class MessagesModule {}
