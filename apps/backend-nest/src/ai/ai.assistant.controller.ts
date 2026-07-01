import { Controller, Post, Body, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import { AiAssistantService } from './ai.assistant.service';
import { StreamAiReplyDto } from './dto/stream.ai.reply.dto';
import { toAssistantSseStream } from './assistant.sse.writer';
import type { User } from '../users/types';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('ai/stream')
  @Sse()
  async streamAiReply(
    @CurrentUser() user: User,
    @Body() body: StreamAiReplyDto,
  ): Promise<Observable<MessageEvent>> {
    await this.aiAssistantService.assertAssistantConversation(
      body.conversationId,
    );

    const replyStream = this.aiAssistantService.generateAssistantReply({
      userId: user.id,
      conversationId: body.conversationId,
    });

    return toAssistantSseStream(replyStream);
  }
}
