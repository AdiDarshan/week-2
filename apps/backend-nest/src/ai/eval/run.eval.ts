import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessagesService } from '../../messages/messages.service';
import { AiAssistantService } from '../ai.assistant.service';

interface EvalPrompt {
  id: string;
  prompt: string;
  expectation: string;
}

const SEED_MESSAGES = [
  'I still need to pay the invoice from last month.',
  'The invoice was approved by finance yesterday.',
  'Can we schedule a meeting for Thursday afternoon?',
  "Let's discuss the budget next week.",
  'hi',
];

async function main(): Promise<void> {
  const prompts = JSON.parse(
    readFileSync(join(__dirname, 'eval.prompts.json'), 'utf8'),
  ) as EvalPrompt[];
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const users = app.get(UsersService, { strict: false });
    const conversations = app.get(ConversationsService, { strict: false });
    const messages = app.get(MessagesService, { strict: false });
    const assistant = app.get(AiAssistantService, { strict: false });

    const user = await users.createUser(
      `eval+${Date.now()}@example.com`,
      'eval-password',
      'Eval User',
    );

    const seedConversation = await conversations.createConversation({
      creator: user,
      participantIds: [],
      type: 'assistant',
    });
    for (const content of SEED_MESSAGES) {
      await messages.createMessage({
        conversationId: seedConversation.id,
        senderId: user.id,
        content,
      });
    }

    for (const evalPrompt of prompts) {
      const conversation = await conversations.createConversation({
        creator: user,
        participantIds: [],
        type: 'assistant',
      });
      await messages.createMessage({
        conversationId: conversation.id,
        senderId: user.id,
        content: evalPrompt.prompt,
      });

      let response = '';
      for await (const token of assistant.generateAssistantReply({
        userId: user.id,
        conversationId: conversation.id,
      })) {
        response += token;
      }

      console.log(`\n─── [${evalPrompt.id}] ───`);
      console.log(`Prompt:      ${evalPrompt.prompt}`);
      console.log(`Expectation: ${evalPrompt.expectation}`);
      console.log(`Response:    ${response.trim()}`);
    }
  } finally {
    await app.close();
  }
}


main().catch((error) => {
  console.error(error);
  process.exit(1);
});
