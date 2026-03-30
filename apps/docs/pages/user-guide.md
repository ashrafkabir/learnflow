# User Guide

## Selection tools (Discover / Illustrate / Mark)

When reading a lesson, you can select text to open quick tools:

- **Discover**: get quick context and related concepts
- **Illustrate**: simplified explanation (and an image if BYOAI is configured)
- **Mark**: save a key takeaway

See: [Selection Tools (Discover / Illustrate / Mark)](./selection-tools).

## Overview

LearnFlow is an AI-powered learning platform (MVP). Some capabilities described in older copy are **planned**; see [MVP Truth](./mvp-truth) and [Roadmap](./roadmap).

## Features

### Dashboard

The home dashboard shows:

- **Course carousel**: Your active courses with progress bars
- **Daily lessons**: Today's recommended lessons
- **Knowledge mindmap**: A preview of your learning connections
- **Learning streak**: Your consecutive days of study

### Conversation Interface

Chat with LearnFlow's AI orchestrator:

- Natural language requests are routed to the appropriate agent
- "I want to learn Rust" → Course Builder
- "Quiz me on chapter 3" → Exam Agent
- "Take notes on this lesson" → Notes Agent
- "Find research on quantum entanglement" → Research Agent
- "Summarize this lesson" → Summarizer Agent

### Course Builder

Generate courses from any topic (best-effort):

1. Enter a topic and select difficulty
2. If a web source provider is configured, the builder discovers public sources and extracts text
3. Basic quality signals may be applied (e.g., domain heuristics, recency/readability approximations)
4. A syllabus is generated and lessons are drafted
5. Lessons include citations when sources are available

**Notes**:

- Source coverage varies by topic and provider configuration.
- Quality scoring is heuristic and not a guarantee of credibility.

### Notes Agent

Three note formats:

- **Cornell**: Cue column (questions), notes, and summary
- **Zettelkasten**: Atomic notes with inter-links
- **Flashcards**: Question/answer pairs for spaced repetition

### Exam Agent (MVP)

AI-generated assessments (best-effort):

- Multiple choice (4 options each)
- Short answer questions

Planned (see roadmap):

- Adaptive targeting / knowledge-gap analysis
- Bloom's taxonomy coverage guarantees

### Research Agent

Find and synthesize sources (best-effort):

- Can use web search providers and/or curated sources depending on deployment configuration
- Structured research summaries
- Citation management (when source metadata is available)

### Summarizer Agent

Condense lessons to key points:

- Preserves key facts
- No hallucinated content
- Output ≤500 words from 3000-word input

### Knowledge Mindmap (MVP)

Visualize your course map and progress:

- Interactive graph with clickable nodes
- Progress-style indicators per node (best-effort)
- Collaborative editing exists in this repo for mindmaps (Yjs-backed) but should be treated as **planned/best-effort** in MVP deployments
- SVG export

See: [Roadmap](./roadmap)

### Marketplace (MVP/mock)

Marketplace UI flows exist for MVP/testing.

- Publishing is best-effort and may be limited by deployment configuration.
- Monetization/payments and durable trust signals (ratings/reviews) are **planned**.

See: [Roadmap](./roadmap)

### Settings

- **Profile & Goals**: Learning objectives and preferences
- **API Keys**: Manage BYOK keys (encrypted at rest with AES-256-GCM; legacy AES-256-CBC supported for backward-compatible decryption)
- **Subscription**: Free/Pro plan management
- **Privacy & Export**: Server-generated data export, account deletion
- **Update Agent**: RSS monitoring + external scheduling (see: [Update Agent scheduling](./update-agent-scheduling))

## Keyboard Shortcuts

| Shortcut | Action       |
| -------- | ------------ |
| `Ctrl+N` | New course   |
| `Ctrl+K` | Quick search |
| `Ctrl+/` | Toggle chat  |
| `Ctrl+M` | Open mindmap |
