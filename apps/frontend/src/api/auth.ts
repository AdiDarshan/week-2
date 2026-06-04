import { KNOWN_USERS } from './mockData';
import type { LoginResponse } from './types';

export async function login(
  username: string,
  _password: string,
): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // fake delay

  const handle = username.trim().toLowerCase();
  const user = KNOWN_USERS.find((user) => user.username === handle);
  if (!user) {
    throw new Error(`Unknown user "${username}"`);
  }

  return {
    token: 'mock-token-' + user.username,
    user,
  };
}
