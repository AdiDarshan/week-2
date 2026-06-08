# API Contract

Wire contract for the chat API. The frontend mock in `src/api/chatApi.ts`
matches these shapes; the Week 3 backend will implement them for real.

- **Base URL**: `https://api.example.com/v1`
- **Auth**: every request after login sends `Authorization: Bearer <token>`
- **Dates**: ISO 8601 strings (e.g. `"2024-05-03T09:00:00.000Z"`)

---

## Error shape

Every non-2xx response uses the same envelope. The HTTP status carries the
broad category; `code` is a stable, machine-readable string clients can branch
on; `message` is human-readable; `details` is optional and only present when
the endpoint has structured extra info (e.g. field-level validation).

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "userId is required"
  }
}
```

Codes currently in use:

| Status | Code              | Meaning                                          |
| ------ | ----------------- | ------------------------------------------------ |
| 400    | `BAD_REQUEST`     | Input is missing, malformed, or fails validation |
| 401    | `UNAUTHENTICATED` | Missing/invalid bearer token                     |
| 403    | `FORBIDDEN`       | Authenticated but not allowed on this resource   |
| 404    | `NOT_FOUND`       | Target resource (conversation, message, or user) does not exist |
| 409    | `CONFLICT`        | Resource conflict (e.g. duplicate or invalid state) |
| 500    | `INTERNAL`        | Unhandled server error                           |

Per-endpoint `Errors` sections below describe which of these each route can
return; they all use this envelope.

---

## `POST /auth/login`

Week 2/3: no real auth. The client declares which user it is by handle
(case-insensitive) and the server resolves it to a user, returning a fake
token plus the matched user. Real credentials land in Week 4.

### Request

```json
{
  "username": "alice"
}
```

### Response — 200 OK

```json
{
  "token": "mock-token-a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
  "user": {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
    "name": "Alice"
  }
}
```

### Errors

- `400 Bad Request` — `username` is missing or not a non-empty string.
- `404 Not Found` — no user matches that `username`.

---

## `GET /conversations`

Returns conversations the caller participates in, sorted by `updatedAt` desc.

### Request

No body. Requires `Authorization` header.

### Response — 200 OK

```json
[
  {
    "id": "1",
    "title": "Alice & Bob",
    "participantIds": ["alice", "bob"],
    "updatedAt": "2024-05-03T09:00:00.000Z"
  }
]
```

---

## `POST /conversations`

Create a new conversation. The authenticated user is automatically added to
the participant list (and deduplicated if also passed in `participantIds`),
so callers don't need to include themselves.

### Request

Requires `Authorization` header.

```json
{
  "participantIds": ["bob", "charlie"],
  "title": "Project sync"
}
```

- `participantIds` — array of user ids (non-empty strings). The caller is
  added automatically; after deduplication the conversation must have **at
  least 2 unique participants** (i.e. at least one *other* user besides the
  caller).
- `title` — optional string. When omitted, empty, or whitespace-only, the
  server derives one from the joined participant names (e.g.
  `"Alice & Bob & Charlie"`).

### Response — 201 Created

```json
{
  "id": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0010",
  "title": "Project sync",
  "participantIds": ["alice", "bob", "charlie"],
  "updatedAt": "2026-06-08T13:55:00.000Z"
}
```

`participantIds` in the response always includes the caller and is fully
deduplicated. `updatedAt` is set to creation time, so the new conversation
sorts to the top of the next `GET /conversations`.

### Errors

- `400 Bad Request` — `participantIds` is missing or not an array, contains
  a non-string or empty string, `title` is provided but not a string, or the
  deduplicated participant set has fewer than 2 users.
- `401 Unauthorized` — missing/invalid bearer token.
- `404 Not Found` — at least one id in `participantIds` does not refer to a
  known user.

---

## `GET /conversations/:id/messages?cursor=<cursor>&limit=<limit>`

Returns one page of messages, oldest → newest within the page.

### Request

- Path: `:id` — conversation id.
- Query:
  - `cursor` — opaque string from the previous page's `nextCursor`. Omit
    for the first page.
  - `limit` — positive integer page size. Optional; defaults to `20` and is
    capped at `100`.

### Response — 200 OK

```json
{
  "messages": [
    {
      "id": "1",
      "conversationId": "1",
      "content": "Hey Bob, are we still on for tomorrow?",
      "senderId": "alice",
      "createdAt": "2024-05-03T09:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

`nextCursor` is a string when more pages exist, `null` otherwise. The cursor
is opaque to clients.

### Errors

- `400 Bad Request` — `cursor` or `limit` is not a string, `limit` is not a
  positive integer, or `cursor` does not refer to a valid offset.
- `401 Unauthorized` — missing/invalid bearer token.
- `403 Forbidden` — caller is not a participant in the conversation.
- `404 Not Found` — no conversation with that `:id` exists.

---

## `POST /conversations/:id/messages`

Create a new message. The server derives the author from the bearer token
and bumps the conversation's `updatedAt` to the new message's `createdAt`,
so the next `GET /conversations` re-sorts it to the top.

### Request

- Path: `:id` — conversation id.
- Body:

```json
{
  "content": "Hello!"
}
```

`content` is trimmed server-side; the trimmed value must be non-empty and
no longer than 4000 characters.

### Response — 201 Created

```json
{
  "id": "f4d1...",
  "conversationId": "1",
  "content": "Hello!",
  "senderId": "alice",
  "createdAt": "2026-05-28T13:55:00.000Z"
}
```

### Errors

- `400 Bad Request` — `content` is missing, not a string, empty after
  trimming, or longer than 4000 characters.
- `401 Unauthorized` — missing/invalid bearer token.
- `403 Forbidden` — caller is not a participant in the conversation.
- `404 Not Found` — no conversation with that `:id` exists.

---

## Changes log

- **2026-05-28** — Initial contract for the Week 2 mock; matches
  `src/api/chatApi.ts`.
- **2026-06-03** — Documented the consistent error envelope
  `{ error: { code, message, details? } }` and the standard `code` values.
- **2026-06-08** — Documented `POST /conversations` (request body, the
  caller-auto-added / dedup behavior, title fallback, and error cases).
