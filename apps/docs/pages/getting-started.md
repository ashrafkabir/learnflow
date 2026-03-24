# Getting Started with LearnFlow

## Prerequisites

- **Node.js 18+** (for self-hosting the API)
- **An AI API key**: OpenAI, Anthropic, or Google AI
- **LearnFlow app**: Download from [learnflow.ai/download](https://learnflow.ai/download)

## Setup

### 1. Download and Install

Download LearnFlow for your platform:

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **iOS**: App Store
- **Android**: Play Store
- **Web**: [app.learnflow.ai](https://app.learnflow.ai)

### 2. Create an Account

1. Open LearnFlow
2. Click "Get Started"
3. Enter your email and create a password (or use Google/GitHub OAuth)

### 3. Configure Your AI API Key

LearnFlow uses a "Bring Your Own Key" (BYOK) model on the free tier:

1. Go to **Settings → API Keys**
2. Click "Add API Key"
3. Select your provider (OpenAI, Anthropic, Google)
4. Paste your API key
5. Click "Verify & Save"

Your key is sent over TLS and encrypted server-side with AES-256-CBC.

> **Pro Tip**: Upgrade to Pro ($20/mo) to use managed API keys — no configuration needed.

### 4. Create Your First Course

1. Click "New Course" on the dashboard
2. Enter a topic: e.g., "Introduction to Machine Learning"
3. Select difficulty: Beginner / Intermediate / Advanced
4. Click "Generate Course"

The Course Builder agent will:

- Research your topic using Firecrawl web scraping
- Score sources for credibility
- Generate a structured syllabus with 5-10 modules
- Create individual lessons with real citations

This typically takes 30-60 seconds.

### 5. Start Learning

- **Read lessons** with full source attribution
- **Take notes** (Cornell, Zettelkasten, or Flashcards)
- **Take quizzes** to identify knowledge gaps
- **Explore your knowledge mindmap** to see connections

## Self-Hosting (Optional)

For self-hosting the LearnFlow API:

```bash
git clone https://github.com/learnflow/learnflow.git
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
- `ENCRYPTION_KEY` — AES-256 key for API key encryption
- `JWT_SECRET` — Secret for JWT token signing
- `FIRECRAWL_API_KEY` — For web content sourcing

## Next Steps

- [User Guide](./user-guide) — Full feature walkthrough
- [API Reference](./api-reference) — All 17 REST endpoints
- [Agent SDK](./agent-sdk) — Build custom agents
