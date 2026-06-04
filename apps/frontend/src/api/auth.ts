import type { LoginRequestDto, LoginResponseDto } from '@week2/shared';
import { apiRequest } from './client';
import type { LoginResponse } from './types';

export async function login(
  username: string,
): Promise<LoginResponse> {
  const body: LoginRequestDto = { username: username.trim() };
  return apiRequest<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body,
  });
}
