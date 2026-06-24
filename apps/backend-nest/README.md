# `@week2/backend-nest`

NestJS implementation of the chat backend used by `apps/frontend`. Implements
the wire contract documented in [`../../API_CONTRACT.md`](../../API_CONTRACT.md):
real bcrypt + JWT auth, conversations, paginated messages, and a unified
error envelope.

State is persisted to **MongoDB** via Mongoose. The connection string is
read from `MONGO_URI` (see [Database](#database)).

## Quick start

To run the full stack (Mongo + this backend + the frontend), you need
**three things** up: MongoDB, the NestJS API on `:3001`, and the Vite
dev server on `:5173`.

From the **repo root**, one-time setup:

```bash
npm install
cp apps/backend-nest/.env.example apps/backend-nest/.env
# edit JWT_SECRET to any string ≥ 16 chars
```

Then, in this order:

```bash
# 1. MongoDB — pick one (see Database section for more options)
brew services start mongodb-community
# or: docker run -d --name chat-mongo -p 27017:27017 -v chat-mongo-data:/data/db mongo:8

# 2. Backend (terminal 1) — http://localhost:3001
npm run dev:backend-nest

# 3. Frontend (terminal 2) — http://localhost:5173
npm run dev
```

Open http://localhost:5173 in two browser windows (use two different
browsers or one incognito) to chat as two users — auth is held in React
state per window, so they need separate sessions.

The backend listens on `PORT` (default `3001`). The frontend defaults
`VITE_API_BASE_URL` to `http://localhost:3001`; override it in
`apps/frontend/.env` if you move the backend.

## Database

The backend talks to MongoDB through `@nestjs/mongoose`. You need a
running Mongo instance reachable at `MONGO_URI` before booting the
server; the database (path segment of the URI, e.g. `chat-app`) is
created on first write.

Run a local Mongo however you prefer. Two common options on macOS:

```bash
# Option A — Homebrew (auto-starts on login)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Option B — Docker
docker run -d --name chat-mongo -p 27017:27017 -v chat-mongo-data:/data/db mongo:8
```

Inspect or wipe data with `mongosh`:

```bash
mongosh "$MONGO_URI"
# inside the shell:
# show collections
# db.messages.deleteMany({})
```

## Environment

All variables are validated at startup by Joi (see `src/app.module.ts`);
missing or malformed values fail boot. See `.env.example` for a working
template.

| Variable               | Required | Example                              | Notes                                                |
| ---------------------- | -------- | ------------------------------------ | ---------------------------------------------------- |
| `PORT`                 | yes      | `3001`                               | Port to listen on.                                   |
| `ALLOWED_CORS_ORIGINS` | yes      | `http://localhost:5173`              | Comma-separated allowed Origins for browser callers. |
| `JWT_SECRET`           | yes      | (long random string, ≥ 16 chars)     | HMAC secret for signing / verifying JWTs.            |
| `MAX_MESSAGE_LENGTH`   | yes      | `4000`                               | Currently validated but unused; see "Known gaps".    |
| `MONGO_URI`            | yes      | `mongodb://localhost:27017/chat-app` | Mongoose connection string; include the db name.     |

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
  users/         GET /users, GET /users/me, users collection
  conversations/ GET /conversations, POST /conversations
  messages/      GET|POST /conversations/:id/messages, cursor pagination
  common/
    filters/      global HttpExceptionFilter → { error: { code, message, details? } }
    interceptors/ request/response logger
    decorators/   @CurrentUser() pulled from the JWT payload
  app.module.ts  config validation + module wiring
  main.ts        bootstrap: ValidationPipe, CORS, listen
```

`*-db.service.ts` in each module wraps the Mongoose model for that
collection; controllers and feature services never import Mongoose
directly.

## API

The wire contract lives in [`../../API_CONTRACT.md`](../../API_CONTRACT.md).
Typical flow:

1. `POST /auth/signup` (or `POST /auth/login`) → `{ token, user }`.
2. Send `Authorization: Bearer <token>` on every subsequent request.
   Tokens expire after 1 hour.

## Known gaps

- **`MAX_MESSAGE_LENGTH` is currently unused.** The 4000-character cap is
  hardcoded in `messages.service.ts`; the env var is validated at boot but
  never read.
- **Companion Express backend.** `apps/backend` is the older Express
  implementation kept for reference. It still uses the mock,
  username-based auth from the original Week 2 contract and does **not**
  match the current `API_CONTRACT.md`. The frontend talks to
  `backend-nest`.
