# LearnFlow

An AI-powered learning platform that uses intelligent agents to create personalized courses, generate study materials, and adapt to each student's learning style.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose** (for local services)
- **Git**

## Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd learnflow
   ```

2. Copy and configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Start infrastructure services:

   ```bash
   docker compose up -d
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Build all packages:
   ```bash
   npm run build
   ```

## Quickstart

```bash
# Start all services in development mode
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

## Project Structure

```
learnflow/
├── packages/
│   ├── shared/    — Shared types, utilities, and config
│   ├── core/      — Core business logic
│   └── agents/    — AI agent implementations
├── apps/
│   ├── api/       — Backend REST API
│   ├── client/    — Mobile/desktop client
│   └── web/       — Marketing website
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Development

This project uses [Turborepo](https://turbo.build/) for monorepo management. Key commands:

- `npm run build` — Build all packages and apps
- `npm run lint` — Lint all packages
- `npm run test` — Run all tests
- `npm run dev` — Start development servers
- `npm run dev:status` — Show what’s currently listening on dev ports + any leftover Turbo dev processes
- `npm run dev:clean` — Safely free the canonical dev ports (3000/3001/3003) by terminating only node/vite/next listeners on those ports
- `npm run pw:list` — List Playwright tests (safe to pipe to `head` without crashing Node with EPIPE)

### Docs

Developer docs live in `apps/docs/pages/*.md`.

### Repo-local ripgrep

Use the repo-local ripgrep binary (via `@vscode/ripgrep`) to keep search behavior consistent across environments:

```bash
# Search for a string in the repo
npm run rg -- "TODO" .

# Search within a package/app
npm run rg -- "useWebSocket" apps/client/src
```

- Selection Tools (Discover / Illustrate / Mark): `apps/docs/pages/selection-tools.md`
- API reference: `apps/docs/pages/api-reference.md`
- Architecture notes: `apps/docs/pages/architecture.md`

The marketing site exposes a lightweight docs landing page at `/docs` (apps/web), which should link back to these Markdown sources.

## License

Private — All rights reserved.
