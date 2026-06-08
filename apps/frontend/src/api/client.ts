import type { ApiErrorCode, ApiErrorDto } from '@week2/shared';

export type ApiClientErrorCode = ApiErrorCode | 'NETWORK_ERROR';

const DEFAULT_BASE_URL = 'http://localhost:3001';

function resolveBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return DEFAULT_BASE_URL;
}

const BASE_URL = resolveBaseUrl();

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiClientErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ApiClientErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

function isApiErrorEnvelope(value: unknown): value is ApiErrorDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const error = (value as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === 'string' && typeof message === 'string';
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', token, body, query } = options;

  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiClientError(
      0,
      'NETWORK_ERROR',
      err instanceof Error ? err.message : 'Network request failed',
    );
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ApiClientError(
        response.status,
        'INTERNAL',
        `Request failed with status ${response.status}`,
      );
    }

    if (isApiErrorEnvelope(payload)) {
      throw new ApiClientError(
        response.status,
        payload.error.code,
        payload.error.message,
        payload.error.details,
      );
    }

    throw new ApiClientError(
      response.status,
      'INTERNAL',
      `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

