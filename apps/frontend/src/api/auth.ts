import { apiRequest } from './client';
import type {
  LoginRequestDto,
  LoginResponseDto,
  SignupRequestDto,
} from './types';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponseDto> {
  const body: LoginRequestDto = { email: email.trim(), password };
  return apiRequest<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body,
  });
}

export async function signup(
  email: string,
  password: string,
  name: string,
): Promise<LoginResponseDto> {
  const body: SignupRequestDto = {
    email: email.trim(),
    password,
    name: name.trim(),
  };
  return apiRequest<LoginResponseDto>('/auth/signup', {
    method: 'POST',
    body,
  });
}
