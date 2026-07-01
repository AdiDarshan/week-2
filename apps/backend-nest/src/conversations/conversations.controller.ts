import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import type { Conversation } from './types';
import type { User } from '../users/types';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Get()
  listConversations(
    @CurrentUser() user: User,
  ): Promise<Conversation[]> {
    return this.conversationsService.getConversationsForUser(user);
  }

  @Post()
  postConversation(
    @CurrentUser() user: User,
    @Body() body: CreateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.createConversation({
      creator: user,
      participantIds: (body.participantIds ?? []).map((id) => id.trim()),
      title: body.title,
      type: body.type,
    });
  }
}
