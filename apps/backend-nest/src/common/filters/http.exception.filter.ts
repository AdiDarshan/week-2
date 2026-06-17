import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError, DomainErrorCategory } from '../errors/domain.error';

type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

const CATEGORY_TO_STATUS: Record<DomainErrorCategory, number> = {
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
};

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, message, details } = this.normalize(exception);
    const code = STATUS_TO_CODE[status] ?? 'INTERNAL';

    if (status >= 500) {
      this.logger.error(
        `Unhandled error: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorEnvelope = {
      error: { code, message, ...(details === undefined ? {} : { details }) },
    };
    response.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof DomainError) {
      return {
        status: CATEGORY_TO_STATUS[exception.category],
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { status, message: res };
      }

      if (typeof res === 'object' && res !== null) {
        const raw = (res as { message?: unknown }).message;
        if (Array.isArray(raw)) {
          const [first, ...rest] = raw.map((m) => String(m));
          return {
            status,
            message: first ?? exception.message,
            details: rest.length > 0 ? raw : undefined,
          };
        }
        if (typeof raw === 'string') {
          return { status, message: raw };
        }
      }

      return { status, message: exception.message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
