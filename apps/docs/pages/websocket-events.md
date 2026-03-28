# WebSocket events (MVP)

LearnFlow uses a WebSocket at **`/ws`** for real-time features such as:

- Streaming AI responses (`response.start` / `response.chunk` / `response.end`)
- Agent activity (`agent.spawned` / `agent.complete`)
- Mindmap updates (`mindmap.update`)

## Connect

**URL:** `ws://<api-host>/ws?token=<JWT>`

- The token is the same JWT returned by the REST login/register endpoints.
- **Dev harness only:** when `NODE_ENV!=production` and `LEARNFLOW_DEV_AUTH=1`, a token value of `dev` is accepted.

On connect, the server sends:

- `connected` — `{ userId }`
- `ws.contract` — a minimal inbound contract for the `message` envelope

## Inbound events (client → server)

### `message`

Send a chat message to the orchestrator.

```json
{
  "event": "message",
  "data": {
    "text": "Explain the CAP theorem",
    "requestId": "optional-correlation-id",
    "message_id": "optional-idempotency-id",
    "courseId": "optional",
    "lessonId": "optional"
  }
}
```

Notes:

- `data.text` is required.
- If you send a `message_id`, the server will treat completed duplicates as a no-op and return an error with code `duplicate_message`.

### `mindmap.subscribe`

Subscribe to (and request) mindmap suggestions.

```json
{
  "event": "mindmap.subscribe",
  "data": {
    "courseId": "optional",
    "lessonId": "optional",
    "seedTopic": "optional"
  }
}
```

## Outbound events (server → client)

### `response.start`

```json
{ "event": "response.start", "data": { "message_id": "...", "agent_name": "orchestrator" } }
```

### `response.chunk`

```json
{
  "event": "response.chunk",
  "data": { "message_id": "...", "content_delta": "...", "type": "text" }
}
```

### `response.end`

```json
{
  "event": "response.end",
  "data": {
    "message_id": "...",
    "actions": [],
    "actionTargets": {},
    "sources": [],
    "researchSummary": {
      "isMock": false,
      "providersTried": ["firecrawl"],
      "papersReviewed": 12,
      "cached": false
    }
  }
}
```

Notes:

- `researchSummary` is optional. When present and `isMock=true`, the client should disclose that research sources may be placeholders (no provider configured).

### `agent.spawned` / `agent.complete`

These describe agent activity in the pipeline.

```json
{ "event": "agent.spawned", "data": { "agent_name": "Orchestrator", "kind": "routing" } }
{ "event": "agent.complete", "data": { "agent_name": "Orchestrator", "kind": "routing" } }
```

### `mindmap.update`

```json
{
  "event": "mindmap.update",
  "data": {
    "courseId": null,
    "suggestions": [{ "id": "...", "label": "...", "reason": "..." }],
    "nodes_added": [],
    "edges_added": []
  }
}
```

### `error`

```json
{
  "event": "error",
  "data": {
    "error": { "code": "...", "message": "...", "details": {} },
    "requestId": "...",
    "message_id": "optional"
  }
}
```
