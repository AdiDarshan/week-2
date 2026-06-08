import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDto } from '@week2/shared';
import { findUserById, findUserByUsername } from '../data/store.js';
import { ApiError } from '../errors/ApiError.js';
import {
  login,
  mintMockToken,
  parseMockToken,
  resolveSessionUser,
} from './auth.service.js';

vi.mock('../data/store.js', () => ({
  findUserById: vi.fn(),
  findUserByUsername: vi.fn(),
}));

const findUserByIdMock = vi.mocked(findUserById);
const findUserByUsernameMock = vi.mocked(findUserByUsername);

const alice: UserDto = { id: 'user-alice', name: 'Alice' };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('mintMockToken / parseMockToken', () => {
  it('round-trips a user id through the token format', () => {
    const token = mintMockToken('user-123');
    expect(token).toBe('mock-token-user-123');
    expect(parseMockToken(token)).toBe('user-123');
  });

  it('returns null when the prefix is missing', () => {
    expect(parseMockToken('')).toBeNull();
    expect(parseMockToken('not-a-token')).toBeNull();
    expect(parseMockToken('Mock-Token-user-1')).toBeNull();
  });

  it('returns null when the user id portion is empty or whitespace-only', () => {
    expect(parseMockToken('mock-token-')).toBeNull();
    expect(parseMockToken('mock-token-   ')).toBeNull();
    expect(parseMockToken('mock-token-\t\n')).toBeNull();
  });
});

describe('login', () => {
  it('returns a token + user for a known username', async () => {
    findUserByUsernameMock.mockReturnValue(alice);

    const result = await login('alice');

    expect(findUserByUsernameMock).toHaveBeenCalledWith('alice');
    expect(result).toEqual({
      token: 'mock-token-user-alice',
      user: alice,
    });
  });

  it('throws ApiError(404, NOT_FOUND) for an unknown username', async () => {
    findUserByUsernameMock.mockReturnValue(undefined);

    await expect(login('ghost')).rejects.toBeInstanceOf(ApiError);
    await expect(login('ghost')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('resolveSessionUser', () => {
  it('returns the user referenced by a valid token', async () => {
    findUserByIdMock.mockReturnValue(alice);

    const user = await resolveSessionUser('mock-token-user-alice');

    expect(findUserByIdMock).toHaveBeenCalledWith('user-alice');
    expect(user).toEqual(alice);
  });

  it('throws ApiError(401, UNAUTHENTICATED) when the token has the wrong prefix', async () => {
    await expect(resolveSessionUser('bogus')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('throws ApiError(401, UNAUTHENTICATED) when the token is empty', async () => {
    await expect(resolveSessionUser('')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('throws ApiError(401, UNAUTHENTICATED) when the user id has no whitespace-stripped value', async () => {
    await expect(resolveSessionUser('mock-token-   ')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('throws ApiError(401, UNAUTHENTICATED) when the referenced user no longer exists', async () => {
    findUserByIdMock.mockReturnValue(undefined);

    await expect(
      resolveSessionUser('mock-token-user-ghost'),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });
});
