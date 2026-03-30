# Architecture Guide

## System Overview

LearnFlow is a monorepo-based platform with a multi-agent architecture.

```
┌─────────────────────────────────────────────────────┐
│                    Client Apps                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ React Web│  │ (future) │  │ (future)         │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────────────┘  │
│       └──────────────┼─────────────┘                │
│                      │ REST + WebSocket              │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│                  API Layer                            │
│  ┌──────────────────────────────────────────────┐   │
│  │  Express.js + WebSocket Server               │   │
│  │  - Auth middleware (JWT + RBAC)               │   │
│  │  - Rate limiter (tier-aware)                  │   │
│  │  - Zod request validation                     │   │
│  │  - OpenAPI spec generation                    │   │
│  └────────────────────┬─────────────────────────┘   │
│                       │                              │
│  ┌────────────────────┼─────────────────────────┐   │
│  │           Orchestrator Agent                  │   │
│  │  - Intent routing (NLU)                       │   │
│  │  - DAG planner (parallel/serial execution)    │   │
│  │  - Student Context Object (SCO) management    │   │
│  │  - Response aggregation                       │   │
│  └────────────────────┬─────────────────────────┘   │
└───────────────────────┼─────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────┐
│                  Agent Layer                          │
│  ┌─────────┐ ┌───────┐ ┌──────┐ ┌──────────┐       │
│  │ Course  │ │ Notes │ │ Exam │ │ Research  │       │
│  │ Builder │ │ Agent │ │Agent │ │ Agent     │       │
│  └────┬────┘ └───────┘ └──────┘ └──────────┘       │
│       │      ┌──────────┐ ┌───────────┐ ┌────────┐ │
│       │      │Summarizer│ │Collaboration││Mindmap │ │
│       │      │ Agent    │ │ Agent      ││Agent   │ │
│       │      └──────────┘ └───────────┘ └────────┘ │
│       │      ┌──────────┐                           │
│       │      │ Update   │                           │
│       │      │ Agent    │                           │
│       │      └──────────┘                           │
└───────┼─────────────────────────────────────────────┘
        │
┌───────┼─────────────────────────────────────────────┐
│       │       Content Pipeline                       │
│  ┌────┴───────────────────────────────────────┐     │
│  │  Web Source Provider → Quality Signals →   │     │
│  │  Near-dup reduction → LLM Synthesis →      │     │
│  │  Citation Formatter → Lesson Output        │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
        │
┌───────┼─────────────────────────────────────────────┐
│       │       Infrastructure                         │
│  ┌────┴──┐  ┌───────┐  ┌───────┐                   │
│  │Postgres│  │ Redis │  │ MinIO │                   │
│  │  (DB)  │  │(Cache)│  │(Files)│                   │
│  └────────┘  └───────┘  └───────┘                   │
└─────────────────────────────────────────────────────┘
```

## Agent Communication

Agents communicate through a message envelope system:

```typescript
interface AgentMessage {
  id: string;
  type: 'request' | 'response' | 'error';
  source: string; // Source agent ID
  target: string; // Target agent ID
  payload: unknown; // Agent-specific data
  context: StudentContextObject;
  timestamp: string;
}
```

### Orchestrator Routing

1. User sends a message
2. Orchestrator performs intent classification
3. DAG planner determines execution order
4. Agents are spawned (parallel when independent)
5. Results are aggregated and returned

### DAG Execution

Independent agents run in parallel:

```
User: "Learn Rust and find papers about it"
  → CourseBuilder (topic: "Rust")  ─┐
  → ResearchAgent (query: "Rust")  ─┤  (parallel)
                                     └→ Aggregator → Response
```

Dependent agents run in sequence:

```
User: "Quiz me on lesson 1"
  → ContentPipeline (get lesson) → ExamAgent (generate quiz) → Response
```

## Monorepo Structure

```
learnflow/
├── packages/
│   ├── core/        — Orchestrator, context, routing
│   ├── agents/      — All agent implementations
│   └── shared/      — Types, utils, config, Zod schemas
├── apps/
│   ├── api/         — Express REST + WebSocket server
│   ├── client/      — React web client
│   ├── web/         — Marketing website (Next.js 14)
│   └── docs/        — Documentation (Nextra)
├── turbo.json       — Turborepo pipeline config
└── docker-compose.yml — PostgreSQL, Redis, MinIO
```

## Technology Decisions

| Decision   | Choice       | Rationale                                                 |
| ---------- | ------------ | --------------------------------------------------------- |
| Monorepo   | Turborepo v2 | Fast incremental builds, shared configs                   |
| API        | Express.js   | Mature, large ecosystem, WebSocket support                |
| Client     | React + Vite | Fast dev experience, SSR not needed                       |
| Marketing  | Next.js 14   | SEO, static export, App Router                            |
| Database   | PostgreSQL   | Robust, JSON support, extensions                          |
| Cache      | Redis        | Pub/sub for WebSocket, rate limiting                      |
| Validation | Zod          | Runtime + compile-time type safety                        |
| Auth       | JWT + bcrypt | Stateless, industry standard                              |
| Encryption | AES-256-GCM  | AEAD (integrity + confidentiality), hardware acceleration |
