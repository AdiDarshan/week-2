# `@week2/backend-nest`

NestJS implementation of the chat backend used by `apps/frontend`. Implements
the wire contract documented in [`../../API_CONTRACT.md`](../../API_CONTRACT.md):
real bcrypt + JWT auth, conversations, paginated messages, and a unified
error envelope.

State is **in-memory** (no database) — users, conversations, and messages
are reset every time the process restarts.

## Quick start

From the **repo root**:

```bash
npm install
cp apps/backend-nest/.env.example apps/backend-nest/.env
npm run dev:backend-nest
```

The server starts on `PORT` (default `3001`). The frontend's
`VITE_API_BASE_URL` should point at the same origin.

## Environment

All variables are validated at startup by Joi (see `src/app.module.ts`);
missing or malformed values fail boot. See `.env.example` for a working
template.

| Variable               | Required | Example                          | Notes                                                |
| ---------------------- | -------- | -------------------------------- | ---------------------------------------------------- |
| `PORT`                 | yes      | `3001`                           | Port to listen on.                                   |
| `ALLOWED_CORS_ORIGINS` | yes      | `http://localhost:5173`          | Comma-separated allowed Origins for browser callers. |
| `JWT_SECRET`           | yes      | (long random string, ≥ 16 chars) | HMAC secret for signing / verifying JWTs.            |
| `MAX_MESSAGE_LENGTH`   | yes      | `4000`                           | Currently validated but unused; see "Known gaps".    |

## Scripts

Run from `apps/backend-nest/`, or via the workspace root with
`npm run <script> --workspace apps/backend-nest`:

- `npm run dev` — start with file watching (`nest start --watch`).
- `npm run start` — start once.
- `npm run start:prod` — run the compiled build (`node dist/main`).
- `npm run build` — compile to `dist/`.
- `npm run typecheck` — `tsc --noEmit` against `tsconfig.build.json`.
- `npm run lint` — ESLint with auto-fix.
- `npm run format` — Prettier write.
- `npm test` — Jest unit tests (`*.spec.ts`, colocated with source).
- `npm run test:watch` / `npm run test:cov` — watch / coverage modes.

The workspace root also wires up:

```bash
npm run dev:backend-nest                   # this app, dev mode
npm test --workspaces --if-present         # all workspaces
npm run typecheck --workspaces --if-present
```

## Layout

```
src/
  auth/          POST /auth/signup, POST /auth/login, JWT strategy + guard
  users/         GET /users, GET /users/me, in-memory user store
  conversations/ GET /conversations, POST /conversations
  messages/      GET|POST /conversations/:id/messages, cursor pagination
  common/
    filters/      global HttpExceptionFilter → { error: { code, message, details? } }
    interceptors/ request/response logger
    decorators/   @CurrentUser() pulled from the JWT payload
  app.module.ts  config validation + module wiring
  main.ts        bootstrap: ValidationPipe, CORS, listen
```

`*-db.service.ts` in each module is the in-memory store; swapping it for a
real database later only touches those files.

## API

The wire contract lives in [`../../API_CONTRACT.md`](../../API_CONTRACT.md).
Typical flow:

1. `POST /auth/signup` (or `POST /auth/login`) → `{ token, user }`.
2. Send `Authorization: Bearer <token>` on every subsequent request.
   Tokens expire after 1 hour.

## Known gaps

- **In-memory store.** Restart = wipe. There is no persistence layer.
- **`MAX_MESSAGE_LENGTH` is currently unused.** The 4000-character cap is
  hardcoded in `messages.service.ts`; the env var is validated at boot but
  never read.
- **Companion Express backend.** `apps/backend` is the older Express
  implementation kept for reference. It still uses the mock,
  username-based auth from the original Week 2 contract and does **not**
  match the current `API_CONTRACT.md`. The frontend talks to
  `backend-nest`.
