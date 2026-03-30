# Introducing LearnFlow: AI-Powered Personalized Learning

**March 2026**

Today, we're launching LearnFlow — a platform that fundamentally rethinks how people learn by combining six specialized AI agents into one cohesive learning experience.

## The Problem

Learning hasn't kept pace with the AI revolution. Most educational platforms still follow a one-size-fits-all model: pre-recorded lectures, static textbooks, and generic quizzes. Meanwhile, the topics people need to learn — from Agentic AI to quantum computing — are evolving faster than any curriculum can keep up with.

We asked: What if your learning experience was as dynamic and personalized as the topics you're learning?

## The Solution: Six AI Agents, One Platform

LearnFlow uses a multi-agent architecture where each agent specializes in one aspect of the learning experience:

### 1. Course Builder Agent

Enter any topic and our AI generates a structured, multi-module course draft. When a web source provider is configured, lessons can be grounded in public sources with citations (best-effort). The exact provider and coverage depend on deployment configuration (BYOAI + optional web sourcing).

A course on "Rust Programming" can draw from official docs, books, and high-quality articles with attribution when sources are available.

### 2. Notes Agent

Once you've read a lesson, the Notes Agent transforms it into study materials in your preferred format:

- **Cornell Notes**: Cue questions, detailed notes, and summary
- **Zettelkasten**: Atomic, interlinked notes for long-term knowledge building
- **Flashcards**: Spaced-repetition ready question-answer pairs

### 3. Exam Agent

Not your typical multiple-choice quiz. Our Exam Agent generates assessments that test across Bloom's taxonomy — from recall to application and analysis. After scoring, it provides a detailed knowledge gap analysis showing exactly which concepts you need to review.

### 4. Research Agent

When enabled via deployment configuration, the Research Agent can use web search providers and other source backends to find and summarize relevant papers and articles (best-effort).

### 5. Summarizer Agent

Long lesson? The Summarizer condenses any content down to key points while preserving factual accuracy. No hallucinated additions, no lost information — just the essential knowledge.

### 6. Orchestrator

Behind the scenes, the Orchestrator routes your natural language requests to the right agent. Say "I want to learn quantum computing" and the Course Builder fires up. Say "quiz me on chapter 3" and the Exam Agent takes over. It's all seamless.

## Source Attribution: No More Hallucinations

One of our core principles is that **important claims should be traceable to a source when sources are available**. Every lesson in LearnFlow includes:

- Inline citations: "Quantum entanglement was experimentally verified by Aspect et al. [1]"
- A References section with full URLs, authors, and publication dates
- Quality signals (heuristic; not a guarantee of credibility)
- Basic source diversity heuristics (best-effort)

## Knowledge Mindmap

As you learn across multiple topics, LearnFlow builds a course map that visualizes your courses/modules/lessons and progress. Richer concept graphs and cross-course linking are planned.

## Marketplace

LearnFlow isn't just for learning — it's for teaching too. Our marketplace lets you:

- **Publish courses** you've built and earn revenue (85/15 split)
- **Discover** community-created courses with ratings and reviews
- **Build custom agents** using our SDK and share them with the community

## Technical Foundation

LearnFlow is built on a modern stack:

- **Turborepo monorepo** with TypeScript throughout
- **Express.js API** with WebSocket streaming
- **React + Vite** client with dark mode and responsive design
- **Zod validation** for type-safe request/response handling
- **AES-256-GCM encryption** for API key storage (Bring Your Own Key model; legacy AES-256-CBC supported for backward-compatible decryption)
- **PostgreSQL, Redis, MinIO** infrastructure

## Start Learning Today

LearnFlow is free to use with your own AI API key (BYOK). Some Pro features (e.g., proactive updates) are supported in the app, while others like managed API keys are planned for a future release.

[Get Started →](https://learnflow.ai)

---

_LearnFlow is open-source. Star us on [GitHub](https://github.com/ashrafkabir/learnflow)._
