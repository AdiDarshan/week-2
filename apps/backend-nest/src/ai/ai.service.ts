import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationNotFoundError } from '../conversations/conversations.errors';
import {
  ASSISTANT_CONVERSATION_TYPE,
  TUTOR_CONVERSATION_TYPE,
} from '../conversations/types';
import type { Conversation } from '../conversations/types';
import { AssistantService } from './assistant/assistant.service';
import { TutorService } from './tutor/tutor.service';
import { NotAnAiConversationError } from './ai.errors';
import type { Message } from '../messages/types';
import type { GenerateReplyInput } from './types';

@Injectable()
export class AiService {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly assistantService: AssistantService,
    private readonly tutorService: TutorService,
  ) {}

  async generateReply(
    input: GenerateReplyInput,
  ): Promise<AsyncGenerator<string, Message>> {
    const conversation = await this.requireAiConversation(
      input.conversationId,
    );

    return conversation.type === TUTOR_CONVERSATION_TYPE
      ? this.tutorService.generateReply(input)
      : this.assistantService.generateReply(input);
  }

  private async requireAiConversation(
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }
    if (
      conversation.type !== ASSISTANT_CONVERSATION_TYPE &&
      conversation.type !== TUTOR_CONVERSATION_TYPE
    ) {
      throw new NotAnAiConversationError(conversationId);
    }
    return conversation;
  }
}
