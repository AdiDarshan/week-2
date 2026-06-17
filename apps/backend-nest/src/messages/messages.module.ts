import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesDbService } from './messages.db.service';
import { MessageSchema } from './schemas/message.schema';
import { UsersModule } from '../users/users.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    UsersModule,
    ConversationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesDbService],
  exports: [MessagesService],
})
export class MessagesModule {}
