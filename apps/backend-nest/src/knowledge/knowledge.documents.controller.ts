import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current.user.decorator';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationNotFoundError } from '../conversations/conversations.errors';
import { TUTOR_CONVERSATION_TYPE } from '../conversations/types';
import { DocumentIngestionService } from './document.ingestion.service';
import { DocumentsService } from './documents.service';
import { NotATutorConversationError } from './knowledge.errors';
import { UploadDocumentDto } from './dto/upload.document.dto';
import type { IngestionResult } from './document.ingestion.service';
import type { DocumentSummary } from './types';
import type { User } from '../users/types';

const NO_CONTENT = 204;

@UseGuards(JwtAuthGuard)
@Controller('knowledge/conversations/:conversationId/documents')
export class KnowledgeDocumentsController {
  constructor(
    private readonly ingestion: DocumentIngestionService,
    private readonly documents: DocumentsService,
    private readonly conversations: ConversationsService,
  ) {}

  @Post()
  async upload(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Body() body: UploadDocumentDto,
  ): Promise<IngestionResult> {
    await this.assertTutorConversation(user.id, conversationId);
    return this.ingestion.ingest({
      userId: user.id,
      conversationId,
      name: body.name,
      mimeType: body.mimeType,
      content: body.content,
    });
  }

  @Get()
  async list(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
  ): Promise<DocumentSummary[]> {
    await this.assertTutorConversation(user.id, conversationId);
    return this.documents.list(user.id, conversationId);
  }

  @Delete(':id')
  @HttpCode(NO_CONTENT)
  async remove(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.assertTutorConversation(user.id, conversationId);
    await this.documents.delete(user.id, conversationId, id);
  }

  private async assertTutorConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new ConversationNotFoundError(conversationId);
    }
    if (conversation.type !== TUTOR_CONVERSATION_TYPE) {
      throw new NotATutorConversationError(conversationId);
    }
  }
}
