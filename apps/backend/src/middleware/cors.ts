import cors from 'cors';
import type { CorsOptions } from 'cors';
import { ApiError } from '../errors/ApiError.js';

const DEFAULT_DEV_ORIGIN = 'http://localhost:5173';

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return [DEFAULT_DEV_ORIGIN];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

const allowedOrigins = new Set(parseAllowedOrigins());

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(
      new ApiError('FORBIDDEN', `Origin "${origin}" is not allowed`),
    );
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);
export const allowedCorsOrigins = Array.from(allowedOrigins);
