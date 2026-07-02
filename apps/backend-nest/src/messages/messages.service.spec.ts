import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesDbService } from './messages.db.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationsDbService } from '../conversations/conversations.db.service';
import {
  ConversationNotFoundError,
  NotAConversationParticipantError,
} from '../conversations/conversations.errors';
import { UsersService } from '../users/users.service';
import { UsersDbService } from '../users/users.db.service';
import { UserNotFoundError } from '../users/users.errors';
import { ConversationsDbFake } from '../testing/conversations.db.fake';
import { MessagesDbFake } from '../testing/messages.db.fake';
import { UsersDbFake } from '../testing/users.db.fake';
import { connectionFake } from '../testing/mongo.connection.fake';
import type { RegisteredUser } from '../users/types';
import type { Conversation } from '../conversations/types';

const UNKNOWN_OBJECT_ID = '000000000000000000000000';

describe('MessagesService', () => {
  let service: MessagesService;
  let usersService: UsersService;
  let conversationsService: ConversationsService;

  let alice: RegisteredUser;
  let bob: RegisteredUser;
  let conversation: Conversation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        UsersService,
        { provide: UsersDbService, useValue: new UsersDbFake() },
        ConversationsService,
        {
          provide: ConversationsDbService,
          useValue: new ConversationsDbFake(),
        },
        { provide: MessagesDbService, useValue: new MessagesDbFake() },
        { provide: getConnectionToken(), useValue: connectionFake() },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    usersService = module.get<UsersService>(UsersService);
    conversationsService = module.get<ConversationsService>(
      ConversationsService,
    );

    alice = await usersService.createUser('a@x.com', 'pw12345678', 'Alice');
    bob = await usersService.createUser('b@x.com', 'pw12345678', 'Bob');
    conversation = await conversationsService.createConversation({
      creator: alice,
      participantIds: [bob.id],
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('creates a message, persists it and bumps the conversation', async () => {
      const before = conversation.updatedAt;
      await new Promise((r) => setTimeout(r, 5));

      const message = await service.createMessage({
        conversationId: conversation.id,
        senderId: alice.id,
        content: '  hello  ',
      });

      expect(message).toMatchObject({
        conversationId: conversation.id,
        senderId: alice.id,
        content: 'hello',
      });
      expect(message.id).toBeDefined();
      expect(message.createdAt).toBeDefined();

      const refreshed = await conversationsService.findById(conversation.id);
      expect(refreshed).toBeDefined();
      expect(refreshed!.updatedAt > before).toBe(true);
    });

    it('rejects an unknown sender with UserNotFoundError', async () => {
      await expect(
        service.createMessage({
          conversationId: conversation.id,
          senderId: UNKNOWN_OBJECT_ID,
          content: 'hi',
        }),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it('rejects an unknown conversation with ConversationNotFoundError', async () => {
      await expect(
        service.createMessage({
          conversationId: UNKNOWN_OBJECT_ID,
          senderId: alice.id,
          content: 'hi',
        }),
      ).rejects.toBeInstanceOf(ConversationNotFoundError);
    });

    it('rejects a non-participant with NotAConversationParticipantError', async () => {
      const carol = await usersService.createUser(
        'c@x.com',
        'pw12345678',
        'Carol',
      );

      await expect(
        service.createMessage({
          conversationId: conversation.id,
          senderId: carol.id,
          content: 'hi',
        }),
      ).rejects.toBeInstanceOf(NotAConversationParticipantError);
    });

    it('rejects empty / whitespace-only content with BadRequestException', async () => {
      await expect(
        service.createMessage({
          conversationId: conversation.id,
          senderId: alice.id,
          content: '   ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects content longer than 4000 characters', async () => {
      await expect(
        service.createMessage({
          conversationId: conversation.id,
          senderId: alice.id,
          content: 'a'.repeat(4001),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getMessagesPage', () => {
    it('returns messages with no nextCursor when fewer than the limit', async () => {
      await service.createMessage({
        conversationId: conversation.id,
        senderId: alice.id,
        content: 'one',
      });
      await service.createMessage({
        conversationId: conversation.id,
        senderId: bob.id,
        content: 'two',
      });

      const page = await service.getMessagesPage({
        conversationId: conversation.id,
        requesterId: alice.id,
      });

      expect(page.messages.map((m) => m.content)).toEqual(['two', 'one']);
      expect(page.nextCursor).toBeNull();
    });

    it('paginates with a cursor when more messages remain', async () => {
      for (let i = 0; i < 3; i += 1) {
        await service.createMessage({
          conversationId: conversation.id,
          senderId: alice.id,
          content: `msg-${i}`,
        });
        await new Promise((r) => setTimeout(r, 2));
      }

      const firstPage = await service.getMessagesPage({
        conversationId: conversation.id,
        requesterId: alice.id,
        limit: 2,
      });

      expect(firstPage.messages).toHaveLength(2);
      expect(firstPage.nextCursor).toEqual(expect.any(String));

      const secondPage = await service.getMessagesPage({
        conversationId: conversation.id,
        requesterId: alice.id,
        limit: 2,
        cursor: firstPage.nextCursor ?? undefined,
      });

      expect(secondPage.messages).toHaveLength(1);
      expect(secondPage.nextCursor).toBeNull();
    });

    it('rejects a non-participant requester with NotAConversationParticipantError', async () => {
      const carol = await usersService.createUser(
        'c@x.com',
        'pw12345678',
        'Carol',
      );

      await expect(
        service.getMessagesPage({
          conversationId: conversation.id,
          requesterId: carol.id,
        }),
      ).rejects.toBeInstanceOf(NotAConversationParticipantError);
    });

    it('rejects an invalid cursor with BadRequestException', async () => {
      await expect(
        service.getMessagesPage({
          conversationId: conversation.id,
          requesterId: alice.id,
          cursor: 'not-a-number',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an invalid limit with BadRequestException', async () => {
      await expect(
        service.getMessagesPage({
          conversationId: conversation.id,
          requesterId: alice.id,
          limit: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
