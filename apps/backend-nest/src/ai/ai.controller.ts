import { Controller, Post, Body, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import { AiService } from './ai.service';
import { StreamAiReplyDto } from './dto/stream.ai.reply.dto';
import { toAiSseStream } from './ai.sse.writer';
import type { User } from '../users/types';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ai/stream')
  @Sse()
  async streamAiReply(
    @CurrentUser() user: User,
    @Body() body: StreamAiReplyDto,
  ): Promise<Observable<MessageEvent>> {
    const replyStream = await this.aiService.generateReply({
      userId: user.id,
      conversationId: body.conversationId,
    });

    return toAiSseStream(replyStream);
  }
}
