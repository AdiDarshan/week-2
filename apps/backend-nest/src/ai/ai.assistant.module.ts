import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai.assistant.service';
import { AiAssistantController } from './ai.assistant.controller';
import { OpenAiLanguageModelService } from './openai.language.model.service';
import { LANGUAGE_MODEL_SERVICE } from './language.model.service.interface';
import { ToolRegistryService } from './tool.registry.service';
import { OutputParserService } from './output.parser.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ConversationsModule, MessagesModule],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    ToolRegistryService,
    OutputParserService,
    { provide: LANGUAGE_MODEL_SERVICE, useClass: OpenAiLanguageModelService },
  ],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
