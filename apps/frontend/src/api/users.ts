import { apiRequest } from './client';
import type { UserDto } from './types';

export async function getUsers(token: string): Promise<UserDto[]> {
  return apiRequest<UserDto[]>('/users', { token });
}
