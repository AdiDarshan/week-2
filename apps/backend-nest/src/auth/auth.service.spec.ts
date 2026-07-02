import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { InvalidCredentialsError } from './auth.errors';
import { UsersService } from '../users/users.service';
import { UsersDbService } from '../users/users.db.service';
import { UsersDbFake } from '../testing/users.db.fake';
import { EmailAlreadyExistsError } from '../users/users.errors';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn().mockReturnValue('fake.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: UsersDbService, useValue: new UsersDbFake() },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('creates a new user, signs a token with their id and returns user info', async () => {
      const response = await service.signup(
        'alice@example.com',
        'supersecret',
        'Alice',
      );

      expect(response.token).toBe('fake.jwt.token');
      expect(response.user.name).toBe('Alice');
      expect(response.user.id).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: response.user.id });
    });

    it('rejects a duplicate email with EmailAlreadyExistsError', async () => {
      await service.signup('alice@example.com', 'supersecret', 'Alice');

      await expect(
        service.signup('alice@example.com', 'othersecret', 'Alice 2'),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
    });

    it('serializes concurrent signups for the same email — exactly one wins', async () => {
      const results = await Promise.allSettled([
        service.signup('race@example.com', 'supersecret', 'A'),
        service.signup('race@example.com', 'supersecret', 'B'),
      ]);

      const fulfilledCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      expect(fulfilledCount).toBe(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(EmailAlreadyExistsError);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const created = await service.signup(
        'alice@example.com',
        'supersecret',
        'Alice',
      );
      jwtService.sign.mockClear();

      const response = await service.login('alice@example.com', 'supersecret');

      expect(response.token).toBe('fake.jwt.token');
      expect(response.user).toEqual({ id: created.user.id, name: 'Alice' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: created.user.id });
    });

    it('rejects an unknown email with InvalidCredentialsError', async () => {
      await expect(
        service.login('ghost@example.com', 'whatever'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('rejects a wrong password with InvalidCredentialsError', async () => {
      await service.signup('alice@example.com', 'supersecret', 'Alice');

      await expect(
        service.login('alice@example.com', 'WRONG-password'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
