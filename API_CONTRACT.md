# API Contract

Wire contract for the chat API. The frontend mock in `src/api/chatApi.ts`
matches these shapes; the Week 3 backend will implement them for real.

- **Base URL**: `https://api.example.com/v1`
- **Auth**: every request after login sends `Authorization: Bearer <token>`
- **Dates**: ISO 8601 strings (e.g. `"2024-05-03T09:00:00.000Z"`)
- **Identifiers**: every `id`, `senderId`, `conversationId`, and entry in
  `participantIds` is a UUID string. `User` additionally carries a separate
  human-readable `username` used for login.

---

## `POST /auth/login`

### Request

```json
{
  "username": "alice",
  "password": "hunter2"
}
```

### Response — 200 OK

```json
{
  "token": "mock-token-alice",
  "user": {
    "id": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
    "username": "alice",
    "name": "Alice"
  }
}
```

---

## `GET /conversations`

Returns conversations the caller participates in, sorted by `updatedAt` desc.

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

---

## `GET /conversations/:id/messages?cursor=<cursor>`

Returns one page of messages, oldest → newest within the page.

### Request

- Path: `:id` — conversation id.
- Query: `cursor` — opaque string from the previous page's `nextCursor`. Omit
  for the first page.

### Response — 200 OK

```json
{
  "messages": [
    {
      "id": "e0e0e0e0-e0e0-4e0e-8e0e-eeeeeeee0001",
      "conversationId": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001",
      "content": "Hey Bob, are we still on for tomorrow?",
      "senderId": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
      "createdAt": "2024-05-03T09:00:00.000Z",
      "isPending": false
    }
  ],
  "nextCursor": null
}
```

`isPending` is always `false` on server-returned messages. The client uses
`true` only for in-flight optimistic messages it has rendered locally before
the server has confirmed them.

`nextCursor` is a string when more pages exist, `null` otherwise. The cursor
is opaque to clients.

---

## `POST /conversations/:id/messages`

Create a new message. The server derives the author from the bearer token.

### Request

```json
{
  "content": "Hello!"
}
```

### Response — 201 Created

```json
{
  "id": "f4d1a8e2-2b4d-4a5f-9c1e-2d3b4c5e6f70",
  "conversationId": "c0c0c0c0-c0c0-4c0c-8c0c-cccccccc0001",
  "content": "Hello!",
  "senderId": "a0a0a0a0-a0a0-4a0a-8a0a-aaaaaaaa0001",
  "createdAt": "2026-05-28T13:55:00.000Z",
  "isPending": false
}
```

---

## Changes log

- **2026-05-28** — Initial contract for the Week 2 mock; matches
  `src/api/chatApi.ts`.
- **2026-06-01** — Added `isPending: boolean` to every `Message`. Server
  always returns `false`; client sets `true` for optimistic messages.
- **2026-06-01** — All identifiers are UUID strings (previously a mix of
  short slugs and sequential numbers). `User` gains a `username` field; the
  `id` is the user's UUID and `username` is the handle used for login.
