# API Contract

Wire contract for the chat backend. The current server implementation lives
in `apps/backend-nest` (NestJS); the canonical client lives in
`apps/frontend/src/api/`.

- **Base URL**: `http://localhost:3001` in dev. Override on the client with
  `VITE_API_BASE_URL`; override on the server with `PORT`.
- **Auth**: real bcrypt-hashed passwords + JWT. After `POST /auth/signup` or
  `POST /auth/login`, every other request must send
  `Authorization: Bearer <token>`. Tokens are HS256 and expire after 1 hour.
- **Dates**: ISO 8601 strings (e.g. `"2024-05-03T09:00:00.000Z"`).
- **IDs**: server-generated UUIDs (v4). Path parameters like `:id` are
  validated as UUIDs and reject malformed values with `400 BAD_REQUEST`.

---

## Error shape

Every non-2xx response uses the same envelope produced by the global
`HttpExceptionFilter`. The HTTP status carries the broad category; `code` is
a stable, machine-readable string clients can branch on; `message` is
human-readable; `details` is optional and only present when the endpoint has
structured extra info (e.g. an array of field-level validation messages).

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "email must be an email"
  }
}
```

Codes currently in use:

| Status | Code              | Meaning                                                  |
| ------ | ----------------- | -------------------------------------------------------- |
| 400    | `BAD_REQUEST`     | Input is missing, malformed, or fails validation         |
| 401    | `UNAUTHENTICATED` | Missing/invalid/expired bearer token, or bad credentials |
| 403    | `FORBIDDEN`       | Authenticated but not allowed on this resource           |
| 404    | `NOT_FOUND`       | Target resource does not exist                           |
| 409    | `CONFLICT`        | Resource conflict (e.g. duplicate email)                 |
| 500    | `INTERNAL`        | Unhandled server error                                   |

When `ValidationPipe` rejects a body or query, the first message becomes
`error.message` and the full array of messages is returned in
`error.details`.

Per-endpoint `Errors` sections below describe which of these each route can
return; they all use this envelope.

---

## `POST /auth/signup`

Create a new user and immediately issue an access token. Email must be
unique across users.

### Request

No auth.

```json
{
  "email": "alice@example.com",
  "password": "hunter22hunter",
  "name": "Alice"
}
```

- `email` — required, must be a valid email.
- `password` — required string, **8–30 characters**. Hashed with bcrypt
  server-side before storage.
- `name` — required string, **1–50 characters**. Used as the display name.

### Response — 201 Created

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
    "name": "Alice"
  }
}
```

### Errors

- `400 Bad Request` — body fails validation (missing/invalid `email`,
  password not 8–30 chars, name not 1–50 chars, etc.).
- `409 Conflict` — `email` is already registered to another user.

---

## `POST /auth/login`

Exchange email + password for an access token.

### Request

No auth.

```json
{
  "email": "alice@example.com",
  "password": "hunter22hunter"
}
```

### Response — 200 OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
    "name": "Alice"
  }
}
```

### Errors

- `400 Bad Request` — body fails validation (missing/invalid `email` or
  `password`).
- `401 Unauthorized` — no user with that email, or the password did not
  match. The message is intentionally generic (`invalid credentials`) and
  does not distinguish the two cases.

---

## `GET /users/me`

Returns the authenticated caller's user profile, derived from the JWT.

### Request

No body. Requires `Authorization` header.

### Response — 200 OK

```json
{
  "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
  "name": "Alice"
}
```

### Errors

- `401 Unauthorized` — missing/invalid/expired bearer token.

---

## `GET /users`

Returns the directory of known users, excluding the authenticated caller.
Used by the frontend to populate a "create conversation" participant picker.

### Request

No body. Requires `Authorization` header.

### Response — 200 OK

```json
[
  {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002",
    "name": "Bob"
  },
  {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0003",
    "name": "Charlie"
  }
]
```

### Errors

- `401 Unauthorized` — missing/invalid bearer token.

---

## `GET /conversations`

Returns conversations the caller participates in, sorted by `updatedAt`
descending.

### Request

No body. Requires `Authorization` header.

### Response — 200 OK

```json
[
  {
    "id": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001",
    "title": "Alice & Bob",
    "participantIds": [
      "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
      "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002"
    ],
    "updatedAt": "2024-05-03T09:00:00.000Z"
  }
]
```

### Errors

- `401 Unauthorized` — missing/invalid bearer token.

---

## `POST /conversations`

Create a new conversation. The authenticated user is automatically added to
the participant list (and deduplicated if also passed in `participantIds`),
so callers don't need to include themselves.

### Request

Requires `Authorization` header.

```json
{
  "participantIds": [
    "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002",
    "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0003"
  ],
  "title": "Project sync"
}
```

- `participantIds` — non-empty array of user ids (the UUIDs returned by
  `GET /users`). The caller is added automatically; after deduplication the
  conversation must have **at least 2 unique participants** (i.e. at least
  one *other* user besides the caller).
- `title` — optional string. When omitted, empty, or whitespace-only, the
  server derives one from the joined participant names (e.g.
  `"Alice & Bob & Charlie"`).

### Response — 201 Created

```json
{
  "id": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0010",
  "title": "Project sync",
  "participantIds": [
    "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
    "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0002",
    "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0003"
  ],
  "updatedAt": "2026-06-08T13:55:00.000Z"
}
```

`participantIds` in the response always includes the caller and is fully
deduplicated. `updatedAt` is set to creation time, so the new conversation
sorts to the top of the next `GET /conversations`.

### Errors

- `400 Bad Request` — `participantIds` is missing, empty, not an array, or
  contains a non-string; `title` is provided but not a string; or the
  deduplicated participant set has fewer than 2 users.
- `401 Unauthorized` — missing/invalid bearer token.
- `404 Not Found` — at least one id in `participantIds` does not refer to
  a known user.

---

## `GET /conversations/:id/messages?cursor=<cursor>&limit=<limit>`

Returns one page of messages, oldest → newest within the page.

### Request

- Path: `:id` — conversation id (UUID).
- Query:
  - `cursor` — opaque string from the previous page's `nextCursor`. Omit
    for the first page.
  - `limit` — positive integer page size in `[1, 100]`. Optional; defaults
    to `20`.

### Response — 200 OK

```json
{
  "messages": [
    {
      "id": "f4d1aaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
      "conversationId": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001",
      "content": "Hey Bob, are we still on for tomorrow?",
      "senderId": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
      "createdAt": "2024-05-03T09:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

`nextCursor` is a string when more pages exist, `null` otherwise. The cursor
is opaque to clients.

### Errors

- `400 Bad Request` — `:id` is not a valid UUID, `limit` is not an integer
  in `[1, 100]`, or `cursor` is invalid (non-integer, negative, or beyond
  the end of the conversation).
- `401 Unauthorized` — missing/invalid bearer token.
- `403 Forbidden` — caller is not a participant in the conversation.
- `404 Not Found` — no conversation with that `:id` exists.

---

## `POST /conversations/:id/messages`

Create a new message. The server derives the author from the bearer token
and bumps the conversation's `updatedAt` to the new message's `createdAt`,
so the next `GET /conversations` re-sorts it to the top.

### Request

- Path: `:id` — conversation id (UUID).
- Body:

```json
{
  "content": "Hello!"
}
```

`content` is required and trimmed server-side; the trimmed value must be
non-empty and no longer than **4000 characters**.

### Response — 201 Created

```json
{
  "id": "f4d1aaaa-aaaa-4aaa-8aaa-aaaaaaaa0002",
  "conversationId": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001",
  "content": "Hello!",
  "senderId": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
  "createdAt": "2026-05-28T13:55:00.000Z"
}
```

### Errors

- `400 Bad Request` — `:id` is not a valid UUID, or `content` is missing,
  not a string, empty after trimming, or longer than 4000 characters.
- `401 Unauthorized` — missing/invalid bearer token.
- `403 Forbidden` — caller is not a participant in the conversation.
- `404 Not Found` — no conversation with that `:id` exists.

---

## Changes log

- **2026-05-28** — Initial contract for the Week 2 mock; matched the
  original `src/api/chatApi.ts` client.
- **2026-06-03** — Documented the consistent error envelope
  `{ error: { code, message, details? } }` and the standard `code` values.
- **2026-06-08** — Documented `POST /conversations` (request body, the
  caller-auto-added / dedup behavior, title fallback, and error cases).
- **2026-06-10** — Documented `GET /users` (directory of known users,
  excluding the caller) used by the new-conversation participant picker.
- **2026-06-10** — Replaced mock username login with real bcrypt + JWT
  auth backed by `apps/backend-nest`: added `POST /auth/signup`, replaced
  `username` with `email` + `password` on `POST /auth/login`, added
  `GET /users/me`, switched all ids to server-generated UUIDs, and noted
  that `:id` path params are validated UUIDs (`400 BAD_REQUEST` on bad
  format).
