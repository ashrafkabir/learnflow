# API Reference (MVP)

This page is a lightweight **API reference stub** for Iteration 71 (WS-07). The **canonical REST contract** is the OpenAPI file:

- **OpenAPI (source):** `apps/api/openapi.yaml`

> Tip: If you run the API locally, you can use your preferred OpenAPI viewer (Redoc, Swagger UI) to browse the spec.

---

## Base URLs (dev)

- API (REST): `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`

---

## Authentication

### REST

Most `/api/v1/*` endpoints require a JWT:

- Header: `Authorization: Bearer <accessToken>`

Obtain tokens via:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/oauth/*` (provider flows)

### WebSocket

Connect with a JWT as a query param:

- `ws://localhost:3000/ws?token=<accessToken>`

---

## requestId policy (REST + WS)

LearnFlow uses a `requestId` to correlate logs, errors, and client-side traces.

### REST

- If the client sends `x-request-id`, the server **echoes it back**.
- If not provided, the server generates a new one.
- The server always sets the response header: `x-request-id: <id>`.

### WS

- The server generates a `requestId` for server-emitted envelopes.
- If the client includes `data.requestId` on a message, the server will **echo it** back on related responses/errors for correlation.

---

## Error envelope (standard)

All REST errors (and WS `error` events) use the same shape:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  },
  "requestId": "req-...",
  "status": 400
}
```

Notes:

- `details` is optional.
- `status` is optional, but included by the API for convenience.

### Stable error codes (common)

- `unauthorized` — missing/invalid/expired JWT (HTTP 401)
- `forbidden` — authenticated but not permitted (HTTP 403)
- `not_found` — unknown route/resource (HTTP 404)
- `rate_limit_exceeded` — rate limited (HTTP 429 or WS `error` event)
- `validation_error` — request validation failed (HTTP 400)
- `internal_error` — unhandled server error (HTTP 500)

---

## Rate limits (REST + WS)

Rate limits are tiered (Free vs Pro) and are intended to be aligned between REST and WS.

- **REST:** enforced via HTTP 429 responses (`rate_limit_exceeded`).
- **WS:** enforced per inbound client message; when exceeded, the server emits `event: "error"` with `error.code = "rate_limit_exceeded"` and (when available) the client `message_id` that was rejected.

(Exact numbers are implementation-defined in this MVP; see server config/limiter implementation for the current values.)

---

## REST endpoints (high level)

For the exhaustive list, use `apps/api/openapi.yaml`.

Common prefixes referenced in the product spec/tests:

- `/api/v1/auth/*` (register/login/refresh/oauth)
- `/api/v1/keys`
- `/api/v1/courses` and `/api/v1/courses/:id`
- `/api/v1/chat`
- `/api/v1/notes`
- `/api/v1/quiz`
- `/api/v1/research`
- `/api/v1/mindmap`
- `/api/v1/subscription`
- `/api/v1/marketplace`
- `/api/v1/profile`
- `/api/v1/bookmarks` (list/create/delete)

## WebSocket events (MVP)

A more complete event-level contract lives here:

- `apps/docs/pages/websocket-events.md`

### Client → Server

#### `message`

```json
{
  "event": "message",
  "data": {
    "message_id": "m-123",
    "text": "Hello",
    "requestId": "optional-client-request-id"
  }
}
```

### Server → Client

#### `response.start`

Signals the start of a streamed response.

#### `response.chunk`

One chunk of streamed output.

#### `response.end`

Signals the end of a streamed response.

#### `agent.spawned`

Emitted when an agent run begins.

#### `agent.complete`

Emitted when an agent run finishes.

#### `progress.update`

Progress updates during longer operations.

#### `error`

Standard error envelope over WS:

```json
{
  "event": "error",
  "data": {
    "error": { "code": "rate_limit_exceeded", "message": "..." },
    "requestId": "req-...",
    "message_id": "m-123"
  }
}
```

---

## Example WS transcript

1. Client sends `message`

2. Server emits:

- `response.start`
- one or more `response.chunk`
- `response.end`

If an error occurs, the server emits:

- `error` (with standard envelope)
