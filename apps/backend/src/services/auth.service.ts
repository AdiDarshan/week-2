import type { LoginResponseDto, UserDto } from '@week2/shared';
import { findUserById, findUserByUsername } from '../data/store.js';
import { ApiError } from '../errors/ApiError.js';

const TOKEN_PREFIX = 'mock-token-';

export function mintMockToken(userId: string): string {
  return `${TOKEN_PREFIX}${userId}`;
}

export function parseMockToken(token: string): string | null {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  const userId = token.slice(TOKEN_PREFIX.length).trim();
  return userId === '' ? null : userId;
}


export async function login(username: string): Promise<LoginResponseDto> {
  const user = findUserByUsername(username);
  if (!user) {
    throw new ApiError('NOT_FOUND', `unknown user "${username}"`);
  }

  return {
    token: mintMockToken(user.id),
    user,
  };
}

export async function resolveSessionUser(token: string): Promise<UserDto> {
  const userId = parseMockToken(token);
  if (!userId) {
    throw new ApiError('UNAUTHENTICATED', 'invalid token');
  }
  const user = findUserById(userId);
  if (!user) {
    throw new ApiError('UNAUTHENTICATED', 'invalid token');
  }
  return user;
}
