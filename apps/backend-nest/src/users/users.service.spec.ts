import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersDbService } from './users.db.service';
import { UsersDbFake } from '../testing/users.db.fake';
import { verifyPassword } from '../common/password.utils';

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const UNKNOWN_OBJECT_ID = '000000000000000000000000';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersDbService, useValue: new UsersDbFake() },
      ],
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
      expect(user.id).toMatch(OBJECT_ID_PATTERN);
      expect(user.passwordHash).not.toBe('supersecret');
      await expect(
        verifyPassword('supersecret', user.passwordHash),
      ).resolves.toBe(true);
    });

    it('persists the user so it can be looked up by email and id', async () => {
      const user = await service.createUser('bob@example.com', 'pw', 'Bob');

      await expect(service.findByEmail('bob@example.com')).resolves.toEqual(
        user,
      );
      await expect(service.findById(user.id)).resolves.toEqual(user);
    });
  });

  describe('findByEmail / findById', () => {
    it('returns undefined for unknown email or id', async () => {
      await expect(
        service.findByEmail('nobody@example.com'),
      ).resolves.toBeUndefined();
      await expect(
        service.findById(UNKNOWN_OBJECT_ID),
      ).resolves.toBeUndefined();
    });
  });

  describe('getUsers', () => {
    it('returns a list of public users (id + name only)', async () => {
      const alice = await service.createUser('a@x.com', 'pw12345678', 'Alice');
      const bob = await service.createUser('b@x.com', 'pw12345678', 'Bob');

      const users = await service.getUsers();

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

    it('returns an empty list when no users have been created', async () => {
      await expect(service.getUsers()).resolves.toEqual([]);
    });
  });
});
