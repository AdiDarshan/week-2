# API Contract

Wire contract for the chat API. The frontend mock in `src/api/chatApi.ts`
matches these shapes; the Week 3 backend will implement them for real.

- **Base URL**: `https://api.example.com/v1`
- **Auth**: every request after login sends `Authorization: Bearer <token>`
- **Dates**: ISO 8601 strings (e.g. `"2024-05-03T09:00:00.000Z"`)

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
    "id": "alice",
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
    "id": "1",
    "title": "Alice & Bob",
    "participantIds": ["alice", "bob"],
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
  "id": "f4d1...",
  "conversationId": "1",
  "content": "Hello!",
  "senderId": "alice",
  "createdAt": "2026-05-28T13:55:00.000Z"
}
```

---

## Changes log

- **2026-05-28** — Initial contract for the Week 2 mock; matches
  `src/api/chatApi.ts`.
