import { z } from 'zod';
import type { ToolDefinition } from '../language.model.service.interface';
import type { MessagesService } from '../../messages/messages.service';

const MIN_RESULTS = 1;
const MAX_RESULTS = 20;
const DEFAULT_RESULTS = 10;

const argsSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe("Keyword or phrase to search for within the user's own messages."),
    limit: z
      .number()
      .int()
      .min(MIN_RESULTS)
      .max(MAX_RESULTS)
      .default(DEFAULT_RESULTS)
      .describe('Maximum number of matching messages to return.'),
  })
  .strict();

type SearchMyMessagesArgs = z.infer<typeof argsSchema>;

export const searchMyMessagesTool = {
  definition: {
    name: 'search_my_messages',
    description:
      'Keyword search over the messages belonging to the current user. ' +
      'Scoped to the authenticated user only — never returns other users\' data.',
    parameters: toJsonSchema(argsSchema),
  } satisfies ToolDefinition,

  argsSchema,

  async run(
    args: SearchMyMessagesArgs,
    userId: string,
    messagesService: MessagesService,
  ): Promise<unknown> {
    const messages = await messagesService.searchMyMessages({
      userId,
      query: args.query,
      limit: args.limit,
    });
    return {
      query: args.query,
      count: messages.length,
      matches: messages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
      })),
    };
  },
};
function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, { io: 'input' }) as Record<
    string,
    unknown
  >;
  delete jsonSchema.$schema;
  return jsonSchema;
}
