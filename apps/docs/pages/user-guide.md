# User Guide

## Selection tools (Discover / Illustrate / Mark)

When reading a lesson, you can select text to open quick tools:

- **Discover**: get quick context and related concepts
- **Illustrate**: simplified explanation (and an image if BYOAI is configured)
- **Mark**: save a key takeaway

See: `Selection Tools (Discover / Illustrate / Mark)`.

## Overview

LearnFlow is an AI-powered learning platform with six specialized agents that work together to create personalized educational experiences.

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

Generate courses from any topic:

1. Enter a topic and select difficulty
2. The builder researches via Firecrawl web scraping
3. Sources are scored for credibility (0-1 scale)
4. A syllabus is generated with prerequisite ordering
5. Each lesson includes content with inline citations

**Source Quality**:

- Academic (.edu, arxiv.org) → 0.9-1.0
- Official docs (rust-lang.org) → 0.9-1.0
- Major publications → 0.8-0.9
- Quality blogs → 0.6-0.8
- Sources below 0.5 are rejected

### Notes Agent

Three note formats:

- **Cornell**: Cue column (questions), notes, and summary
- **Zettelkasten**: Atomic notes with inter-links
- **Flashcards**: Question/answer pairs for spaced repetition

### Exam Agent

AI-generated assessments:

- Multiple choice (4 options each)
- Short answer questions
- Bloom's taxonomy coverage (recall → application)
- Knowledge gap analysis after scoring

### Research Agent

Find and synthesize academic papers:

- Semantic Scholar integration
- Structured research summaries
- Citation management

### Summarizer Agent

Condense lessons to key points:

- Preserves key facts
- No hallucinated content
- Output ≤500 words from 3000-word input

### Knowledge Mindmap

Visualize learning connections:

- Interactive graph with clickable nodes
- Mastery indicators per node
- CRDT-powered collaborative editing
- SVG export

### Marketplace

**Course Marketplace**:

- Browse community-created courses
- Filter by topic, difficulty, price
- Enroll and rate courses
- Revenue split: 85/15 (BYOAI), 80/20 (Pro)

**Agent Marketplace**:

- Browse and activate custom agents
- Agent sandbox for security
- SDK for building custom agents

### Settings

- **Profile & Goals**: Learning objectives and preferences
- **API Keys**: Manage BYOK keys (encrypted with AES-256)
- **Subscription**: Free/Pro plan management
- **Privacy & Export**: GDPR data export, account deletion

## Keyboard Shortcuts

| Shortcut | Action       |
| -------- | ------------ |
| `Ctrl+N` | New course   |
| `Ctrl+K` | Quick search |
| `Ctrl+/` | Toggle chat  |
| `Ctrl+M` | Open mindmap |
