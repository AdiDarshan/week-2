import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { ConversationsDbService } from './conversations.db.service';
import { UsersService } from '../users/users.service';
import { UsersDbService } from '../users/users.db.service';
import { UserNotFoundError } from '../users/users.errors';
import type { RegisteredUser } from '../users/types';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let usersService: UsersService;

  let alice: RegisteredUser;
  let bob: RegisteredUser;
  let carol: RegisteredUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        ConversationsDbService,
        UsersService,
        UsersDbService,
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    usersService = module.get<UsersService>(UsersService);

    alice = await usersService.createUser('a@x.com', 'pw12345678', 'Alice');
    bob = await usersService.createUser('b@x.com', 'pw12345678', 'Bob');
    carol = await usersService.createUser('c@x.com', 'pw12345678', 'Carol');
  });

  describe('createConversation', () => {
    it('creates a conversation including the creator in participants', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
      });

      expect(conversation.id).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
      expect(conversation.participantIds.sort()).toEqual(
        [alice.id, bob.id].sort(),
      );
    });

    it('deduplicates participant ids and the creator', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id, bob.id, alice.id],
      });

      expect(conversation.participantIds.sort()).toEqual(
        [alice.id, bob.id].sort(),
      );
    });

    it('defaults the title to the participant names joined with " & "', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id, carol.id],
      });

      expect(conversation.title).toBe('Alice & Bob & Carol');
    });

    it('uses a trimmed custom title when provided', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
        title: '  Project planning  ',
      });

      expect(conversation.title).toBe('Project planning');
    });

    it('falls back to the default title when the custom title is blank', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
        title: '   ',
      });

      expect(conversation.title).toBe('Alice & Bob');
    });

    it('rejects a conversation with no other participants', async () => {
      await expect(
        service.createConversation({
          creator: alice,
          participantIds: [alice.id],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects unknown participants with UserNotFoundError', async () => {
      await expect(
        service.createConversation({
          creator: alice,
          participantIds: ['00000000-0000-0000-0000-000000000000'],
        }),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('getConversationsForUser', () => {
    it('returns only conversations the user participates in', async () => {
      const aliceBob = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
      });
      const bobCarol = await service.createConversation({
        creator: bob,
        participantIds: [carol.id],
      });

      const forAlice = await service.getConversationsForUser(alice);
      expect(forAlice.map((c) => c.id)).toEqual([aliceBob.id]);

      const forBob = await service.getConversationsForUser(bob);
      expect(forBob.map((c) => c.id).sort()).toEqual(
        [aliceBob.id, bobCarol.id].sort(),
      );

      const forCarol = await service.getConversationsForUser(carol);
      expect(forCarol.map((c) => c.id)).toEqual([bobCarol.id]);
    });

    it('returns conversations sorted by updatedAt descending', async () => {
      const first = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
        title: 'first',
      });
      await new Promise((r) => setTimeout(r, 5));
      const second = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
        title: 'second',
      });

      const list = await service.getConversationsForUser(alice);
      expect(list.map((c) => c.id)).toEqual([second.id, first.id]);
    });
  });

  describe('updateLastMessageAt', () => {
    it('updates the updatedAt of an existing conversation', async () => {
      const conversation = await service.createConversation({
        creator: alice,
        participantIds: [bob.id],
      });
      const later = new Date(Date.now() + 60_000);

      await service.updateLastMessageAt(conversation.id, later);

      const refreshed = await service.findById(conversation.id);
      expect(refreshed?.updatedAt).toBe(later.toISOString());
    });

    it('is a no-op for an unknown conversation id', async () => {
      await expect(
        service.updateLastMessageAt(
          '000000000000000000000000',
          new Date(),
        ),
      ).resolves.not.toThrow();
    });
  });
});
