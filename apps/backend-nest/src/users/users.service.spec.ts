import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersDbService } from './users.db.service';
import { verifyPassword } from '../common/password.utils';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, UsersDbService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('stores the user with a hashed password and a generated id', async () => {
      const user = await service.createUser(
        'alice@example.com',
        'supersecret',
        'Alice',
      );

      expect(user.email).toBe('alice@example.com');
      expect(user.name).toBe('Alice');
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(user.passwordHash).not.toBe('supersecret');
      await expect(
        verifyPassword('supersecret', user.passwordHash),
      ).resolves.toBe(true);
    });

    it('persists the user so it can be looked up by email and id', async () => {
      const user = await service.createUser('bob@example.com', 'pw', 'Bob');

      expect(service.findByEmail('bob@example.com')).toEqual(user);
      expect(service.findById(user.id)).toEqual(user);
    });
  });

  describe('findByEmail / findById', () => {
    it('returns undefined for unknown email or id', () => {
      expect(service.findByEmail('nobody@example.com')).toBeUndefined();
      expect(service.findById('00000000-0000-0000-0000-000000000000')).toBe(
        undefined,
      );
    });

    it('treats emails case- and whitespace-insensitively', async () => {
      const created = await service.createUser(
        '  Alice@Example.COM ',
        'pw12345678',
        'Alice',
      );

      expect(created.email).toBe('alice@example.com');
      expect(service.findByEmail('alice@example.com')).toEqual(created);
      expect(service.findByEmail('ALICE@example.com')).toEqual(created);
      expect(service.findByEmail('  alice@EXAMPLE.com  ')).toEqual(created);
    });
  });

  describe('getUsers', () => {
    it('returns a list of public users (id + name only)', async () => {
      const alice = await service.createUser('a@x.com', 'pw12345678', 'Alice');
      const bob = await service.createUser('b@x.com', 'pw12345678', 'Bob');

      const users = service.getUsers();

      expect(users).toHaveLength(2);
      expect(users).toEqual(
        expect.arrayContaining([
          { id: alice.id, name: 'Alice' },
          { id: bob.id, name: 'Bob' },
        ]),
      );
      for (const u of users) {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).not.toHaveProperty('email');
      }
    });

    it('returns an empty list when no users have been created', () => {
      expect(service.getUsers()).toEqual([]);
    });
  });
});
