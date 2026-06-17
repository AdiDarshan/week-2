import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import type { MessagesPage } from './types';
import type { MessageDto } from './dto/message.dto';
import type { User } from '../users/types';

@UseGuards(JwtAuthGuard)
@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  listMessages(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessagesPage> {
    return this.messagesService.getMessagesPage({
      conversationId,
      requesterId: user.id,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Post()
  postMessage(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() body: CreateMessageDto,
  ): Promise<MessageDto> {
    return this.messagesService.createMessage({
      conversationId,
      senderId: user.id,
      content: body.content,
    });
  }
}
