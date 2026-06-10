import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../users/types';

interface AuthenticatedUserRequest extends Request {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedUserRequest>();
    const user = request.user;
    if (!user || typeof user.id !== 'string' || typeof user.name !== 'string') {
      throw new InternalServerErrorException(
        'authenticated user is missing on the request',
      );
    }
    return user;
  },
);
