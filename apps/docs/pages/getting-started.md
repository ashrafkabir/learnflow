# Getting Started with LearnFlow

## Prerequisites

- **Node.js 18+** (for self-hosting the API)
- **An AI API key**: OpenAI, Anthropic, or Google AI
- **LearnFlow**: Web-first MVP — open in your browser at [app.learnflow.ai](https://app.learnflow.ai)

## Setup

### 1. Open the Web App

LearnFlow is a **web-first MVP** — no installation required.

- **Web**: [app.learnflow.ai](https://app.learnflow.ai)

> Native iOS/Android and desktop apps may be offered in a future release.

### 2. Create an Account

1. Open LearnFlow
2. Click "Get Started"
3. Enter your email and create a password (OAuth providers are not part of the current MVP)

### 3. Configure Your AI API Key

LearnFlow uses a "Bring Your Own Key" (BYOK) model on the free tier:

1. Go to **Settings → API Keys**
2. Click "Add API Key"
3. Select your provider (OpenAI, Anthropic, Google)
4. Paste your API key
5. Click "Verify & Save"

Your key is sent over TLS and encrypted server-side with AES-256-GCM (legacy AES-256-CBC supported for backward-compatible decryption).

> **Note**: "Managed API keys" are not part of the current MVP. LearnFlow currently uses a Bring Your Own Key (BYOK) model.

### 4. Create Your First Course

1. Click "New Course" on the dashboard
2. Enter a topic: e.g., "Introduction to Machine Learning"
3. Select difficulty: Beginner / Intermediate / Advanced
4. Click "Generate Course"

The Course Builder agent will (best-effort):

- Discover public web sources when a web-search provider is configured
- Apply basic quality signals (domain/recency/readability heuristics) and reduce near-duplicates
- Generate a structured syllabus with modules
- Draft lessons with citations when sources are available

Timing varies by topic, provider configuration, and rate limits.

### 5. Start Learning

- **Read lessons** with citations when sources are available
- **Take notes** (Cornell, Zettelkasten, or Flashcards)
- **Take quizzes** to identify knowledge gaps
- **Explore your mindmap** to see your course map and progress

## Self-Hosting (Optional)

For self-hosting the LearnFlow API:

```bash
git clone https://github.com/ashrafkabir/learnflow.git
cd learnflow
npm install
cp .env.example .env
# Edit .env with your database and API keys
docker compose up -d  # PostgreSQL, Redis, MinIO
npm run dev
```

Environment variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis for caching and rate limiting
- `ENCRYPTION_KEY` — **Required in production**. 32-byte (64 hex chars) key used for API key encryption at rest (AES-256-GCM; legacy AES-256-CBC supported for backward-compatible decryption).
- `JWT_SECRET` — Secret for JWT token signing
- `FIRECRAWL_API_KEY` — For web content sourcing

## Next Steps

- [User Guide](./user-guide) — Full feature walkthrough
- [API Reference](./api-reference) — All 17 REST endpoints
- [Agent SDK](./agent-sdk) — Build custom agents
