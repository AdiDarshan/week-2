import type { User } from '../users/types';

export interface LoginResponse {
  token: string;
  user: User;
}
