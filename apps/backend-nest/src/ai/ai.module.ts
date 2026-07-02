import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AssistantService } from './assistant/assistant.service';
import { TutorService } from './tutor/tutor.service';
import { OpenAiLanguageModelService } from './assistant/openai.language.model.service';
import { LANGUAGE_MODEL_SERVICE } from './assistant/language.model.service.interface';
import { ToolRegistryService } from './assistant/tool.registry.service';
import { OutputParserService } from './assistant/output.parser.service';
import { TutorLanguageModelService } from './tutor/tutor.language.model.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [ConversationsModule, MessagesModule, KnowledgeModule],
  controllers: [AiController],
  providers: [
    AiService,
    AssistantService,
    TutorService,
    ToolRegistryService,
    OutputParserService,
    TutorLanguageModelService,
    { provide: LANGUAGE_MODEL_SERVICE, useClass: OpenAiLanguageModelService },
  ],
  exports: [AssistantService, TutorService],
})
export class AiModule {}
