import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import type { ToolDefinition } from './language.model.service.interface';
import { UnknownToolError } from './ai.errors';
import { OutputParserService } from './output.parser.service';
import { searchMyMessagesTool } from './tools/search.tool';

@Injectable()
export class ToolRegistryService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly outputParser: OutputParserService,
  ) {}

  getToolDefinitions(): ToolDefinition[] {
    return [searchMyMessagesTool.definition];
  }
 async callTool(
    name: string,
    rawArguments: string,
    ctx: { userId: string },
  ): Promise<unknown> {
    switch (name) {
      case searchMyMessagesTool.definition.name: {
        const parsed = this.outputParser.parseToolArguments(
          rawArguments,
          searchMyMessagesTool.argsSchema,
        );
        if (!parsed.success) {
          return { error: `Invalid arguments: ${parsed.errorMessage}` };
        }
        return searchMyMessagesTool.run(
          parsed.data,
          ctx.userId,
          this.messagesService,
        );
      }
      default:
        throw new UnknownToolError(name);
    }
  }
}
