# API Reference

Base URL: `https://api.learnflow.ai/api/v1`

All endpoints require `Authorization: Bearer <token>` unless noted.

## Authentication

### POST `/auth/register` _(no auth required)_

Create a new account.

```json
// Request
{ "email": "user@example.com", "password": "securepassword", "displayName": "Alice" }

// Response 201
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": { "id": "...", "email": "...", "tier": "free" } }
```

### POST `/auth/login` _(no auth required)_

Log in with credentials.

```json
// Request
{ "email": "user@example.com", "password": "securepassword" }

// Response 200
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### POST `/auth/refresh`

Refresh an expired access token.

### POST `/auth/oauth/google`

OAuth login via Google.

## API Keys

### POST `/keys`

Store an encrypted API key.

```json
// Request
{ "provider": "openai", "apiKey": "sk-abc123..." }

// Response 201
{ "id": "key-1", "provider": "openai", "maskedKey": "sk-...c123", "createdAt": "..." }
```

### GET `/keys`

List stored API keys (masked).

### DELETE `/keys/:id`

Remove a stored API key.

## Courses

### POST `/courses`

Generate a new course from a topic.

```json
// Request
{ "topic": "Machine Learning", "difficulty": "intermediate" }

// Response 201
{ "id": "course-1", "topic": "Machine Learning", "modules": [...], "status": "generating" }
```

### GET `/courses`

List user's courses.

### GET `/courses/:id`

Get course details with modules and lessons.

### GET `/courses/:id/lessons/:lessonId`

Get full lesson content with references.

## Chat

### POST `/chat`

Send a message to the orchestrator.

```json
// Request
{ "message": "I want to learn Rust programming", "context": {} }

// Response 200
{ "response": "...", "agentUsed": "course_builder", "actions": [...] }
```

### WebSocket `/ws`

Real-time streaming for agent responses.

Events:

- `response.start` — Agent begins generating
- `response.chunk` — Partial response data
- `response.end` — Generation complete
- `agent.spawned` — Sub-agent activated
- `agent.complete` — Sub-agent finished

## Notes

### POST `/notes`

Generate notes from lesson content.

```json
// Request
{ "lessonId": "l1", "format": "cornell" }

// Response 200
{ "notes": { "cues": [...], "content": "...", "summary": "..." } }
```

## Quizzes

### POST `/quiz`

Generate a quiz for a module.

### POST `/quiz/:id/submit`

Submit quiz answers and receive score + knowledge gaps.

## Research

### POST `/research`

Search for academic papers on a topic.

## Mindmap

### GET `/mindmap`

Get user's knowledge graph.

### PUT `/mindmap`

Update mindmap nodes/edges.

## Subscription

### GET `/subscription`

Get current subscription status and features.

### POST `/subscription`

Subscribe, upgrade, downgrade, or cancel.

### POST `/subscription/iap`

Validate App Store/Play Store IAP receipt.

## Marketplace

### GET `/marketplace/courses`

Browse published courses.

### POST `/marketplace/courses`

Publish a course.

### GET `/marketplace/agents`

Browse available agents.

### POST `/marketplace/agents`

Submit an agent for review.

## Profile

### GET `/profile`

Get user profile and learning goals.

### PUT `/profile`

Update profile and goals.

---

## Error Format

All errors follow this format:

```json
{ "error": "error_code", "message": "Human-readable description", "code": 400 }
```

## Rate Limits

| Tier | Limit            |
| ---- | ---------------- |
| Free | 100 requests/min |
| Pro  | 500 requests/min |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
