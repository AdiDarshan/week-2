import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsDbService } from './conversations.db.service';
import { ConversationSchema } from './schemas/conversation.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
    ]),
    UsersModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsDbService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
