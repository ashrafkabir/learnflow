# LEARNFLOW

Agentic Learning Experience Platform

### COMPREHENSIVE PRODUCT SPECIFICATION

Multi-Agent Architecture • Cross-Platform Client • Marketplace

Version 1.0 | March 2026 | CONFIDENTIAL

Prepared for Product & Engineering Teams

Table of Contents

# 1. Executive Summary

LearnFlow is a free, cross-platform agentic learning experience platform that empowers individuals to define learning goals, curate personalized courses through conversational AI, and achieve mastery through bite-sized lessons. The platform uses a multi-agent orchestration architecture where a central Orchestrator Agent dynamically spawns specialized agents for content creation, research, summarization, examination, peer collaboration, and more.

The platform is available on macOS, Windows, Android, and iOS. Students bring their own AI API key (BYOAI) for free access, or subscribe to a professional tier for guaranteed skill updates, proactive learning experiences, and managed AI infrastructure. A two-sided marketplace allows creators to publish courses (free or paid) and students to discover agent-enhanced learning paths.

■ **CORE VALUE PROPOSITION**

- Conversational course creation: students describe goals and the platform builds structured, attributed learning paths

- Multi-agent architecture: specialized agents for notes, research, exams, collaboration, and more from a marketplace

- Bite-sized mastery: every lesson is under 10 minutes of reading, optimized for retention

- BYOAI free tier: students use their own API keys at zero platform cost

- Professional subscription: managed infrastructure, proactive skill updates, priority agent access

- Course marketplace: creators publish free or paid courses; learners discover curated paths

# 2. Product Vision & Positioning

## 2.1 Vision Statement

_Democratize personalized mastery-based learning by combining conversational AI, autonomous agents, and community-driven content into a single, beautiful, cross-platform experience that is free for anyone with an API key and premium for professionals who need managed, always-current skill development._

## 2.2 Target Users

|                       |                                                                           |                      |
| --------------------- | ------------------------------------------------------------------------- | -------------------- |
| **Persona**           | **Description**                                                           | **Tier**             |
| Self-Directed Learner | Hobbyist or career-changer exploring new domains at their own pace        | Free (BYOAI)         |
| University Student    | Supplementing coursework with AI-curated, exam-ready materials            | Free (BYOAI)         |
| Working Professional  | Needs to stay current on rapidly evolving skills (AI/ML, cloud, security) | Pro Subscription     |
| Corporate L&D Team    | Deploying structured skill-building programs across departments           | Enterprise (future)  |
| Course Creator        | Subject matter expert who publishes courses on the marketplace            | Free / Revenue Share |

## 2.3 Competitive Differentiation

|                 |                                              |                                       |
| --------------- | -------------------------------------------- | ------------------------------------- |
| **Dimension**   | **LearnFlow**                                | **Competitors (Coursera/Udemy/Khan)** |
| Content Source  | Real-time internet curation with attribution | Pre-recorded, static content          |
| Personalization | Conversational goal-setting, adaptive agents | Algorithmic recommendations           |
| Cost            | Free with BYOAI; affordable Pro tier         | $20-50/mo subscription walls          |
| Lesson Format   | Bite-sized (<10 min), always current         | Long-form videos, aging content       |
| Agents          | Extensible multi-agent marketplace           | No agent ecosystem                    |
| Creator Economy | Two-sided marketplace with revenue share     | Instructor-led only                   |

# 3. System Architecture

## 3.1 High-Level Architecture

LearnFlow follows a layered architecture with clear separation between the client applications, API gateway, orchestration layer, agent mesh, and data persistence. All inter-service communication uses gRPC internally and REST/WebSocket externally.

■ **ARCHITECTURE LAYERS**

- Client Layer: Native apps (macOS, Windows, iOS, Android) built with cross-platform framework (Flutter or React Native) sharing a unified design system

- API Gateway Layer: Rate limiting, authentication, API key validation, WebSocket upgrade for real-time agent communication

- Orchestration Layer: Orchestrator Agent manages session state, spawns/routes to specialized agents, tracks behavioral context

- Agent Mesh Layer: Containerized agents (Docker/K8s) with service discovery, each agent exposing a standardized tool interface

- Data Layer: PostgreSQL (user/course metadata), Pinecone/Weaviate (vector store for content embeddings), Redis (session/cache), S3 (media assets)

- Content Pipeline: Web scraper workers, attribution tracker, content quality scorer, lesson formatter

## 3.2 Technology Stack

|                   |                                             |                                                             |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **Layer**         | **Technology**                              | **Rationale**                                               |
| Client Framework  | Flutter (Dart) or React Native (TypeScript) | Single codebase for all 4 platforms with native performance |
| API Gateway       | Kong / AWS API Gateway + Lambda authorizers | Scalable, managed, supports WebSocket                       |
| Backend Services  | Node.js (TypeScript) + FastAPI (Python)     | TS for API layer, Python for ML/agent orchestration         |
| Orchestration     | Custom agent runtime on LangGraph / CrewAI  | Stateful multi-agent workflows with tool-use support        |
| Vector Database   | Pinecone or Weaviate                        | Semantic search over curated content and user context       |
| Primary Database  | PostgreSQL (Supabase)                       | ACID compliance, JSON support, real-time subscriptions      |
| Cache / Sessions  | Redis Cluster                               | Sub-millisecond session state for orchestrator context      |
| Object Storage    | AWS S3 / Cloudflare R2                      | Course assets, exported PDFs, mindmap images                |
| Search / Scraping | Firecrawl / Playwright + Cheerio            | Reliable web content extraction with JS rendering           |
| Auth              | Supabase Auth / Clerk                       | Social login, API key management, RBAC                      |
| CI/CD             | GitHub Actions + Docker + K8s (EKS/GKE)     | Automated testing, canary deploys, agent versioning         |
| Monitoring        | Datadog / Grafana + LangSmith               | Full-stack observability + LLM trace debugging              |

# 4. Multi-Agent Architecture

## 4.1 Orchestrator Agent

The Orchestrator is the central intelligence layer. It receives all user interactions, maintains session context (goals, interests, progress, subscription tier, behavioral history), and dynamically spawns or routes to specialized agents. It is the only agent the user directly communicates with; all other agents are invoked transparently.

■ **ORCHESTRATOR RESPONSIBILITIES**

- Maintain and update the Student Context Object (goals, interests, progress, activity history, subscription status)

- Parse user intent from conversational input and determine which agent(s) to invoke

- Spawn agents from the registry, passing relevant context slices

- Aggregate multi-agent responses into coherent user-facing output

- Track behavioral signals (time-on-lesson, completion rates, search patterns) and feed into context

- Enforce rate limits and API key validation for BYOAI users

- Escalate to human support or fallback gracefully when agent capabilities are exceeded

## 4.2 Core Agent Catalog

|                       |                                                                                                                                          |                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Agent**             | **Function**                                                                                                                             | **Trigger**                                                |
| Course Builder Agent  | Scours internet for latest articles, papers, tutorials; structures into bite-sized lessons with attribution; builds syllabus and mindmap | User defines a learning goal or topic                      |
| Content Scraper Agent | Extracts, cleans, and attributes web content; scores quality; deduplicates against existing corpus                                       | Course Builder requests source material                    |
| Notes Agent           | Creates structured notes, flashcards, and summaries from lesson content; supports Zettelkasten and Cornell formats                       | User requests notes or reaches end of lesson               |
| Research Agent        | Deep-dives into emerging research; finds primary sources, preprints, conference papers; synthesizes findings                             | User asks for deeper understanding or latest research      |
| Exam Agent            | Generates quizzes, practice exams, coding challenges; scores responses; identifies knowledge gaps                                        | User requests assessment or completes a module             |
| Collaboration Agent   | Matches students with similar interests/goals; facilitates study groups, peer reviews, and shared mindmaps                               | User opts into collaboration or system detects synergy     |
| Summarizer Agent      | Condenses long-form content into key takeaways; produces executive summaries for professionals                                           | User requests summary or lesson exceeds time threshold     |
| Mindmap Agent         | Extends and visualizes the learner's knowledge graph; shows concept relationships and coverage gaps                                      | User explores course structure or requests visual overview |
| Update Agent (Pro)    | Monitors subscribed topics for new developments; proactively pushes refreshed lessons                                                    | Scheduled (daily/weekly) for Pro subscribers               |
| Export Agent          | Packages courses, notes, and progress into PDF, Markdown, or SCORM format for offline use or LMS import                                  | User requests export                                       |

## 4.3 Agent Communication Protocol

All agents communicate through a standardized message envelope that includes the requesting agent ID, target agent ID, context slice, task specification, and response schema. The Orchestrator uses a DAG-based execution planner to parallelize independent agent calls and serialize dependent ones.

■ **MESSAGE ENVELOPE SCHEMA**

{ "message_id": "uuid", "from_agent": "orchestrator", "to_agent": "course_builder", "context": { "user_id": "...", "goals": \[...\], "progress": {...} }, "task": { "type": "build_course", "params": { "topic": "...", "depth": "intermediate", "max_lessons": 20 } }, "response_schema": { "type": "course_outline", "fields": \["title", "lessons\[\]", "sources\[\]"\] }, "timeout_ms": 30000, "priority": "high" }

## 4.4 BYOAI Key Management

Free-tier users provide their own API keys (OpenAI, Anthropic, Google, Mistral, etc.). The platform validates keys on entry, encrypts at rest (AES-256), and routes agent LLM calls through the user's key. Keys are never logged or transmitted to third parties. The system supports key rotation and usage dashboards so students can monitor their spend.

- Supported providers: OpenAI, Anthropic, Google Gemini, Mistral, Groq, Ollama (local)

- Key storage: encrypted in user vault, decrypted only at agent runtime in ephemeral memory

- Usage tracking: per-agent token counts surfaced in user dashboard

- Fallback: if key is exhausted or invalid, orchestrator notifies user with clear error and suggested action

# 5. Client Application

## 5.1 Platform Matrix

|              |                                               |                      |                            |
| ------------ | --------------------------------------------- | -------------------- | -------------------------- |
| **Platform** | **Distribution**                              | **Min Version**      | **Framework**              |
| macOS        | Direct download (.dmg) + Homebrew cask        | macOS 13 (Ventura)   | Flutter desktop / Electron |
| Windows      | Direct download (.exe/.msi) + Microsoft Store | Windows 10 21H2+     | Flutter desktop / Electron |
| iOS          | App Store (free)                              | iOS 16+              | Flutter mobile             |
| Android      | Google Play + APK sideload                    | Android 10 (API 29)+ | Flutter mobile             |
| Web (future) | Progressive Web App                           | Modern browsers      | Flutter web                |

## 5.2 Core UI/UX Screens

■ **5.2.1 ONBOARDING FLOW**

1.  Welcome screen: clean branding, one-line value prop, Get Started button

2.  Goal Setting: conversational interface where user describes what they want to learn, target timeline, current skill level

3.  Interest Mapping: tags/chips for related domains; system suggests adjacent topics

4.  API Key Setup (BYOAI): guided key entry with provider selection, validation, and privacy assurance

5.  Subscription Choice: clear Free vs Pro comparison; one-tap upgrade with Stripe/App Store billing

6.  First Course Generation: orchestrator builds initial course in real-time with progress animation

■ **5.2.2 HOME DASHBOARD**

- Active Courses carousel with progress rings and estimated completion

- Today's Lessons: prioritized bite-sized content queue (daily recommended path)

- Mindmap Overview: interactive knowledge graph showing all learning domains and connections

- Streak/Progress stats: days active, lessons completed, mastery percentage

- Notifications feed: agent updates, peer messages, marketplace recommendations

■ **5.2.3 CONVERSATION INTERFACE**

The primary interaction surface is a chat-style interface where the student converses with the Orchestrator. The system renders rich responses including formatted lesson content, interactive mindmaps, code blocks, quizzes, source citations, and agent activity indicators (showing which agent is working).

- Message bubbles with markdown rendering, syntax highlighting, LaTeX math support

- Agent activity indicator: subtle animation showing which agent is currently processing

- Quick-action chips: contextual suggested actions (Take Notes, Quiz Me, Go Deeper, See Sources)

- Mindmap panel: side drawer showing the evolving knowledge graph; nodes are clickable to explore

- Source drawer: expandable attribution panel showing original articles/papers with links

■ **5.2.4 COURSE VIEW**

- Structured syllabus view with module/lesson hierarchy

- Individual lesson view: clean reading experience, <10 min estimated read time indicator

- Inline source citations with hover-preview

- Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question

- Progress tracker: visual completion across modules

■ **5.2.5 MINDMAP EXPLORER**

- Full-screen interactive graph (D3.js / vis.js based)

- Nodes represent concepts; edges represent relationships

- Color-coded by mastery level (not started, in progress, mastered)

- Tap a node to expand with sub-concepts or jump to related lesson

- Add nodes manually or through conversation with Orchestrator

■ **5.2.6 AGENT MARKETPLACE**

- Browsable catalog of available agents organized by category

- Each agent card shows: name, description, rating, usage count, required API provider

- One-tap activation; agent appears in Orchestrator's available tools

- Community-contributed agents with review/moderation pipeline

■ **5.2.7 COURSE MARKETPLACE**

- Discovery feed with trending, new, and recommended courses

- Filter by topic, difficulty, duration, rating, free/paid

- Course detail page: syllabus preview, creator profile, reviews, price

- One-tap enroll; course imports into learner's workspace

- Creator dashboard: publishing flow, analytics, earnings

■ **5.2.8 PROFILE & SETTINGS**

- Learning goals and interests management

- API key vault with provider management and usage stats

- Subscription management (upgrade/downgrade/cancel)

- Notification preferences

- Export data (courses, notes, progress) in portable format

- Privacy controls and data deletion

## 5.3 Design System

■ **TYPOGRAPHY**

- Primary: Inter or SF Pro (system-native feel)

- Monospace: JetBrains Mono (code blocks)

- Scale: 12/14/16/20/24/32px with 1.5 line height for body

■ **COLOR PALETTE**

|            |                |               |                                       |
| ---------- | -------------- | ------------- | ------------------------------------- |
| **Token**  | **Light Mode** | **Dark Mode** | **Usage**                             |
| Primary    | \#1A1A2E       | \#F8FAFC      | Text, key actions                     |
| Accent     | \#2563EB       | \#60A5FA      | Links, interactive elements, progress |
| Success    | \#16A34A       | \#4ADE80      | Mastery, completion, streaks          |
| Warning    | \#F59E0B       | \#FCD34D      | In-progress, attention needed         |
| Error      | \#DC2626       | \#F87171      | Failed validation, alerts             |
| Surface    | \#FFFFFF       | \#0F172A      | Card/panel backgrounds                |
| Background | \#F8FAFC       | \#020617      | Page background                       |

■ **DESIGN PRINCIPLES**

- Clean and professional: generous whitespace, no visual clutter, information hierarchy

- Progressive disclosure: show essential information first, details on demand

- Agent transparency: always show which agent is working and why

- Mobile-first responsive: touch targets, swipe gestures, adaptive layouts

- Accessibility: WCAG 2.1 AA, screen reader support, high-contrast mode, keyboard navigation

# 6. Content Pipeline

## 6.1 Content Acquisition

The Course Builder Agent, working with the Content Scraper Agent, performs intelligent web discovery to find the most authoritative and current sources for any learning topic. The pipeline respects robots.txt, rate limits, and content licensing.

7.  Topic Decomposition: Orchestrator breaks user's learning goal into a concept hierarchy

8.  Source Discovery: Scraper queries multiple search APIs (Google, Bing, Semantic Scholar, arXiv) and curated registries

9.  Content Extraction: Firecrawl/Playwright renders pages; Cheerio extracts article body, metadata, and publication date

10. Quality Scoring: content is scored on authority (domain reputation), recency, relevance (semantic similarity to topic), and readability (Flesch-Kincaid)

11. Attribution Recording: original URL, author, publication, date, license, and access timestamp are stored

12. Deduplication: near-duplicate detection via MinHash/SimHash against existing corpus

13. Lesson Formatting: approved content is chunked into bite-sized lessons (<10 min read, ~1500 words max)

## 6.2 Lesson Structure

|                     |                                                               |                |
| ------------------- | ------------------------------------------------------------- | -------------- |
| **Element**         | **Description**                                               | **Max Length** |
| Title               | Clear, descriptive lesson title                               | 80 characters  |
| Estimated Time      | Reading time badge (always <10 min)                           | N/A            |
| Learning Objectives | 2-3 bullet points: what you will understand after this lesson | 150 chars each |
| Core Content        | Well-structured prose with headings, code blocks, diagrams    | 1500 words     |
| Key Takeaways       | 3-5 memorable summary points                                  | 100 chars each |
| Sources             | Attributed links to original content                          | No limit       |
| Next Steps          | Suggested follow-up lessons or deeper dives                   | 3 suggestions  |
| Quick Check         | 1-2 comprehension questions (optional, auto-generated)        | N/A            |

## 6.3 Attribution Model

Every piece of sourced content carries a full attribution chain. Users can tap any citation to see the original source. The platform maintains a source credibility index that weights future recommendations. Content creators on the marketplace also benefit from attribution when their published courses are referenced.

# 7. Marketplace

## 7.1 Course Marketplace

The course marketplace is a two-sided platform where creators publish structured learning experiences and learners discover, enroll, and rate courses. Courses can be free (community contribution) or paid (creator sets price, platform takes a percentage).

■ **CREATOR FLOW**

14. Creator builds course using LearnFlow's conversational tools or imports structured content

15. Course passes automated quality checks: minimum lessons, attribution compliance, readability scores

16. Creator sets pricing (free or $1-$99), writes description, selects category/tags

17. Course enters moderation queue (automated + human review for paid courses)

18. Published to marketplace with creator profile and analytics dashboard

■ **REVENUE MODEL**

|                              |                            |                                                        |
| ---------------------------- | -------------------------- | ------------------------------------------------------ |
| **Tier**                     | **Revenue Split**          | **Features**                                           |
| Free Course                  | N/A                        | Community visibility, creator profile, usage analytics |
| Paid Course (BYOAI user)     | 85% creator / 15% platform | Full marketplace placement, featured eligibility       |
| Paid Course (Pro subscriber) | 80% creator / 20% platform | Priority placement, Pro badge, enhanced analytics      |

## 7.2 Agent Marketplace

The agent marketplace enables developers to publish specialized agents that extend LearnFlow's capabilities. All marketplace agents are free to use (the student's own API key covers LLM costs). Agents must conform to the LearnFlow Agent SDK specification.

■ **AGENT SDK REQUIREMENTS**

- Implement the standard agent interface: initialize(), process(context, task), and cleanup()

- Declare required LLM providers and minimum model capabilities

- Provide a manifest.json with name, description, version, capabilities, input/output schemas

- Pass security review: no data exfiltration, no unauthorized network calls, sandboxed execution

- Include test suite with minimum 80% coverage

■ **AGENT CATEGORIES**

- Learning Tools: flashcard generators, spaced repetition engines, concept mappers

- Assessment: quiz builders, coding challenge runners, portfolio reviewers

- Research: paper finders, citation managers, trend analyzers

- Collaboration: peer matching, group study facilitators, peer review systems

- Productivity: schedule optimizers, goal trackers, Pomodoro timers

- Export/Integration: LMS connectors, Notion/Obsidian sync, PDF generators

# 8. Subscription & Monetization

|                   |                                  |                                      |
| ----------------- | -------------------------------- | ------------------------------------ |
| **Feature**       | **Free (BYOAI)**                 | **Pro ($14.99/mo)**                  |
| API Key           | Student provides their own       | Managed by platform (pooled keys)    |
| Course Creation   | Unlimited                        | Unlimited + priority generation      |
| Agent Access      | All marketplace agents           | All + Pro-exclusive agents           |
| Proactive Updates | None                             | Daily/weekly skill refresh alerts    |
| Mindmap           | Basic (100 nodes)                | Advanced (unlimited nodes, export)   |
| Collaboration     | Community forums                 | Priority peer matching, study groups |
| Course Publishing | Free courses only                | Free + paid courses                  |
| Export            | Markdown only                    | PDF, SCORM, Notion, Obsidian         |
| Support           | Community                        | Priority email + chat                |
| Usage Limits      | Subject to user's API key limits | Platform-managed, high limits        |

■ **FUTURE TIERS**

- Enterprise ($49/user/mo): SSO, SCIM provisioning, custom agent deployment, LMS integration, admin dashboard, SLA

- API Access ($29/mo): full API for building custom integrations and automations on top of LearnFlow

# 9. Behavioral Tracking & Context System

LearnFlow continuously tracks learning behaviors to build a rich Student Context Object that the Orchestrator uses to personalize every interaction. All tracking is privacy-conscious, stored per-user, and deletable on request.

## 9.1 Student Context Object

■ **DATA POINTS TRACKED**

- Goals: declared learning objectives with target dates and priority levels

- Interests: topic tags, browse history, search queries, bookmarked content

- Progress: per-lesson completion, quiz scores, mastery levels, time spent

- Activity: session frequency, time-of-day patterns, preferred lesson length

- Subscription: tier, billing status, API key provider, usage quotas

- Preferences: notification settings, preferred agents, display preferences

- Social: collaboration opt-in status, peer connections, shared courses

- Feedback: lesson ratings, agent ratings, course reviews

## 9.2 Context Utilization

The Orchestrator receives the full Student Context Object (or relevant slices) with every interaction. This enables it to prioritize lesson recommendations based on knowledge gaps, adjust difficulty based on quiz performance, suggest peer connections based on overlapping goals, time lesson pushes to match the student's active hours, and recommend marketplace courses aligned with declared interests.

## 9.3 Privacy & Compliance

- GDPR and CCPA compliant: full data export, right to deletion, consent management

- Data minimization: only track what improves the learning experience

- No third-party data sales: behavioral data is used exclusively for personalization

- Anonymized analytics: aggregate usage patterns for platform improvement

- Transparent tracking: users can view everything tracked about them in Profile \> Data

# 10. Multi-Agent Orchestration Prompt

The following is the master system prompt for the Orchestrator Agent. This prompt governs all behavior, agent spawning, context management, and user interaction patterns.

**ORCHESTRATOR AGENT SYSTEM PROMPT**

You are the LearnFlow Orchestrator Agent, the central intelligence of a multi-agent learning platform. You manage the complete lifecycle of a student's learning journey: from goal-setting through course creation, lesson delivery, assessment, and mastery tracking.

■ **IDENTITY & ROLE**

You are the ONLY agent the student directly interacts with. All other agents are tools you invoke transparently. You maintain a warm, encouraging, expert-tutor persona. You never reveal internal agent routing decisions unless the student asks about the system's workings. You respond conversationally but always drive toward the student's learning goals.

■ **CONTEXT MANAGEMENT**

At the start of every session, you receive the Student Context Object containing: declared goals and their priorities, current progress across all active courses, recent activity history (last 7 days), subscription tier and API key status, behavioral preferences (lesson length, difficulty, active hours), and collaboration settings. You use this context to personalize every response. You proactively reference past progress, celebrate milestones, and identify knowledge gaps.

■ **AGENT SPAWNING RULES**

You have access to the following agent registry. You spawn agents by emitting a tool-call with the agent name and a context/task payload. You can spawn multiple agents in parallel for independent tasks. You always aggregate agent responses before presenting to the student.

**CORE AGENTS:**

- course_builder: Invoke when the student declares a new learning goal or requests a course on a topic. Pass: topic, desired depth, estimated duration, prerequisite knowledge from context.

- content_scraper: Invoked BY course_builder (not directly by you). Finds and extracts web content. You do not call this directly.

- notes_agent: Invoke when the student says 'take notes', 'summarize this', or completes a lesson. Pass: lesson content, preferred note format from context.

- research_agent: Invoke when the student asks 'go deeper', 'find latest research', or requests primary sources. Pass: topic, current knowledge level, desired depth.

- exam_agent: Invoke when the student says 'quiz me', 'test my knowledge', or completes a module. Pass: covered topics, lesson content, difficulty from context.

- collaboration_agent: Invoke when the student opts into collaboration, asks for study partners, or the context shows overlapping goals with other users. Pass: user's goals, interests, and collaboration preferences.

- summarizer_agent: Invoke when content exceeds the bite-size threshold or the student requests a summary. Pass: full content, desired summary length.

- mindmap_agent: Invoke when the student asks to 'see my progress', 'show the map', or when a new course is created to extend the knowledge graph. Pass: current graph state, new concepts to add.

- update_agent: (Pro only) Invoke on scheduled triggers to check for new developments in subscribed topics. Pass: subscribed topics, last update timestamp.

- export_agent: Invoke when the student requests download, export, or offline access. Pass: content to export, desired format.

**MARKETPLACE AGENTS:**

Marketplace agents are dynamically loaded based on the student's activated agents list from context. When a student's request matches a marketplace agent's capability declaration, prefer the marketplace agent if it has a higher relevance score than the built-in alternative. Always inform the student when using a marketplace agent for the first time in a session.

■ **COURSE CREATION WORKFLOW**

When a student declares a learning goal:

19. Acknowledge the goal and ask clarifying questions: current skill level, time commitment, specific areas of interest within the topic

20. Once you have sufficient context, invoke course_builder with the refined parameters

21. Present the generated syllabus to the student as an interactive outline

22. Invoke mindmap_agent to create or extend the knowledge graph with new course concepts

23. Begin delivering the first lesson, keeping it under 10 minutes of reading

24. After each lesson, offer contextual actions: Take Notes, Quiz Me, Go Deeper, Next Lesson

■ **LESSON DELIVERY RULES**

- Every lesson MUST be under 10 minutes of estimated reading time (~1500 words maximum)

- Every lesson MUST include source attributions with clickable links

- Lessons should use clear headings, code blocks where relevant, and visual aids when possible

- After presenting a lesson, ALWAYS offer 3-4 contextual action chips based on the student's typical behavior patterns

- If a lesson's source material is stale (\>6 months for fast-moving topics), proactively invoke content_scraper for fresh content

■ **BEHAVIORAL ADAPTATION**

You continuously adapt based on observed behavior:

- If quiz scores are consistently high (\>90%), increase difficulty and suggest advanced topics

- If quiz scores are low (<60%), offer to re-explain concepts, suggest prerequisite material, or break down complex lessons

- If the student hasn't been active for \>3 days, send a gentle re-engagement message (Pro: proactive notification)

- If the student frequently uses notes_agent, auto-suggest note-taking at lesson completion

- If the student's goals change, offer to restructure the course syllabus

■ **CONVERSATION STYLE**

- Be warm, encouraging, and professional. Never condescending.

- Use the student's name when available.

- Celebrate milestones: completed modules, streak achievements, mastery milestones.

- When explaining complex concepts, use analogies and real-world examples.

- Keep conversational responses concise; long content goes into structured lesson format.

- When the student seems frustrated, acknowledge the difficulty and offer alternative approaches.

■ **ERROR HANDLING**

- If an agent fails, do not expose the error. Explain that the specific capability is temporarily unavailable and suggest alternatives.

- If a BYOAI key is exhausted or invalid, clearly explain the issue and guide the student to resolve it.

- If content scraping returns no results, acknowledge the gap and suggest related topics or alternative search terms.

- Always maintain conversation flow even during partial failures.

# 11. API Specification

## 11.1 Core Endpoints

|            |                                                |                                                            |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **Method** | **Endpoint**                                   | **Description**                                            |
| POST       | /api/v1/auth/register                          | Create account (email, social, or passkey)                 |
| POST       | /api/v1/auth/login                             | Authenticate and receive JWT                               |
| POST       | /api/v1/keys                                   | Add/update BYOAI API key                                   |
| GET        | /api/v1/keys                                   | List configured API keys with usage stats                  |
| POST       | /api/v1/chat                                   | Send message to Orchestrator (WebSocket upgrade available) |
| GET        | /api/v1/courses                                | List user's enrolled courses with progress                 |
| POST       | /api/v1/courses                                | Create a new course (triggers course_builder)              |
| GET        | /api/v1/courses/:id                            | Get course detail with syllabus and progress               |
| GET        | /api/v1/courses/:id/lessons/:lessonId          | Get individual lesson content                              |
| POST       | /api/v1/courses/:id/lessons/:lessonId/complete | Mark lesson complete                                       |
| GET        | /api/v1/mindmap                                | Get user's full knowledge graph                            |
| GET        | /api/v1/marketplace/courses                    | Browse course marketplace                                  |
| GET        | /api/v1/marketplace/agents                     | Browse agent marketplace                                   |
| POST       | /api/v1/marketplace/agents/:id/activate        | Activate a marketplace agent                               |
| GET        | /api/v1/profile/context                        | Get full Student Context Object                            |
| POST       | /api/v1/subscription                           | Subscribe/upgrade/downgrade                                |
| GET        | /api/v1/analytics                              | Get learning analytics dashboard data                      |

## 11.2 WebSocket Events

|                 |                 |                                          |
| --------------- | --------------- | ---------------------------------------- |
| **Event**       | **Direction**   | **Payload**                              |
| message         | Client → Server | { text, attachments, context_overrides } |
| response.start  | Server → Client | { message_id, agent_name }               |
| response.chunk  | Server → Client | { message_id, content_delta, type }      |
| response.end    | Server → Client | { message_id, actions\[\], sources\[\] } |
| agent.spawned   | Server → Client | { agent_name, task_summary }             |
| agent.complete  | Server → Client | { agent_name, result_summary }           |
| mindmap.update  | Server → Client | { nodes_added\[\], edges_added\[\] }     |
| progress.update | Server → Client | { course_id, lesson_id, completion% }    |

# 12. Marketing Website Specification

## 12.1 Information Architecture

■ **PAGES**

25. Homepage: hero with value prop, product demo video/animation, feature highlights, social proof, pricing, CTA

26. Features: detailed breakdown of all capabilities with screenshots and animations

27. Pricing: clear Free vs Pro comparison table with FAQ

28. Marketplace: preview of available courses and agents with search

29. Docs: comprehensive developer documentation (Next.js + MDX)

30. Blog: product updates, learning tips, creator spotlights

31. About: team, mission, privacy commitment

32. Download: platform-specific download buttons with auto-detection

## 12.2 Homepage Wireframe

■ **HERO SECTION**

- Headline: 'Learn anything. Master everything. Powered by AI agents.'

- Subhead: 'Set your goals, and intelligent agents build your personalized learning path from the best content on the web. Free with your own API key.'

- Primary CTA: 'Download Free' (auto-detects platform)

- Secondary CTA: 'See How It Works' (scrolls to demo)

- Background: subtle animated knowledge graph visualization

■ **FEATURE SECTIONS**

- 'Your Goals, Your Path' — conversational course creation demo

- 'Agents That Work For You' — agent card carousel with live activity animation

- 'Bite-Sized Mastery' — lesson format showcase with <10 min badge

- 'Your Knowledge, Visualized' — interactive mindmap demo

- 'Learn Together' — collaboration features showcase

- 'Marketplace' — course and agent marketplace preview

■ **TRUST & SOCIAL PROOF**

- User testimonial cards

- Stats: courses created, lessons completed, agents available

- Security & privacy badges

- Press mentions / partner logos

## 12.3 Tech Stack (Website)

- Framework: Next.js 14 (App Router) with TypeScript

- Styling: Tailwind CSS + Framer Motion

- CMS: MDX for docs/blog

- Analytics: PostHog (privacy-first)

- Deployment: Vercel

- Forms: React Hook Form + Zod validation

# 13. Documentation Plan

|                       |                          |                                                                              |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| **Document**          | **Audience**             | **Content**                                                                  |
| Getting Started Guide | New Users                | Account creation, API key setup, first course creation walkthrough           |
| User Guide            | All Users                | Complete feature reference: courses, mindmaps, agents, marketplace, settings |
| Pro User Guide        | Pro Subscribers          | Proactive updates, advanced agents, export options, priority features        |
| Agent SDK Reference   | Developers               | Agent interface spec, manifest schema, testing guide, submission process     |
| API Reference         | Developers               | REST + WebSocket endpoints, auth, rate limits, error codes, examples         |
| Course Creator Guide  | Creators                 | Course structure requirements, quality guidelines, pricing, publishing flow  |
| Privacy & Security    | All Users                | Data handling, GDPR/CCPA, key encryption, deletion procedures                |
| Architecture Guide    | Engineering              | System design, agent communication, deployment, scaling strategy             |
| Contributing Guide    | Open Source Contributors | Code style, PR process, agent contribution workflow, license                 |

# 14. Development Roadmap

## 14.1 Phase 1: Foundation (Weeks 1–8)

■ **INFRASTRUCTURE**

- Set up monorepo (Turborepo or Nx) with shared packages

- Provision cloud infrastructure (AWS/GCP): database, cache, object storage, container registry

- Configure CI/CD pipelines with automated testing gates

- Implement auth system with BYOAI key management

■ **CORE AGENTS**

- Build Orchestrator Agent with context management and agent spawning

- Build Course Builder Agent with content scraper integration

- Build Notes Agent and Summarizer Agent

- Define Agent SDK v1 specification

■ **MVP CLIENT**

- Implement onboarding flow (goal setting, API key setup)

- Build conversation interface with markdown rendering

- Build course view with lesson display and progress tracking

- Desktop builds: macOS (.dmg) and Windows (.exe)

## 14.2 Phase 2: Experience (Weeks 9–16)

- Mindmap Explorer with interactive knowledge graph

- Exam Agent with quiz generation and scoring

- Research Agent with academic paper discovery

- Collaboration Agent with peer matching

- Mobile builds: iOS (TestFlight) and Android (Play beta)

- Marketing website v1 launch

- User documentation v1

## 14.3 Phase 3: Marketplace (Weeks 17–24)

- Course marketplace: publishing flow, discovery, payments (Stripe)

- Agent marketplace: submission, review, activation

- Pro subscription launch with managed API keys

- Update Agent for Pro subscribers

- Export Agent with PDF, SCORM, and Obsidian sync

- Public App Store / Play Store launch

## 14.4 Phase 4: Scale (Weeks 25–32)

- Enterprise tier: SSO, SCIM, admin dashboard

- API access tier for third-party integrations

- Advanced analytics and learning insights

- Internationalization (i18n) for top 10 languages

- Community features: forums, creator spotlights, events

- Performance optimization and infrastructure scaling

# 15. Testing Strategy

|                     |                                                            |                                |                               |
| ------------------- | ---------------------------------------------------------- | ------------------------------ | ----------------------------- |
| **Test Type**       | **Scope**                                                  | **Tools**                      | **Threshold**                 |
| Unit Tests          | Agent logic, API handlers, UI components                   | Jest, Testing Library, Pytest  | \>85% coverage                |
| Integration Tests   | Agent-to-agent communication, API flows                    | Supertest, Playwright          | All critical paths            |
| E2E Tests           | Full user journeys: onboarding through course completion   | Playwright, Detox (mobile)     | Top 10 user flows             |
| Agent Tests         | Prompt regression, output quality, hallucination detection | LangSmith, custom eval harness | <5% hallucination rate        |
| Load Tests          | API throughput, WebSocket concurrency, agent scaling       | k6, Artillery                  | 1000 concurrent users         |
| Security Tests      | OWASP Top 10, API key handling, injection attacks          | OWASP ZAP, Snyk                | Zero critical vulnerabilities |
| Accessibility Tests | WCAG 2.1 AA compliance across all screens                  | Axe, Lighthouse                | \>95 accessibility score      |

# 16. Multi-Agent Build Prompt

The following is the master prompt designed to be run iteratively with an AI coding assistant until all functions, UI/UX, marketing website, and documentation are built and tested. This prompt should be provided to the coding agent at the start of each session, and the agent should continue from where it left off based on the progress tracker.

**LEARNFLOW BUILD AGENT — MASTER EXECUTION PROMPT**

You are the LearnFlow Build Agent, responsible for implementing the complete LearnFlow platform from specification to deployment. You work iteratively, maintaining a progress tracker, and completing one workstream at a time until the entire platform is built, tested, and documented.

■ **SESSION PROTOCOL**

33. At the start of every session, read PROGRESS.md to understand current state

34. Identify the next incomplete workstream from the checklist

35. Implement, test, and commit the workstream

36. Update PROGRESS.md with completed items and any blockers

37. If a workstream is blocked, skip to the next available one and note the dependency

38. Continue until all workstreams are complete

■ **WORKSTREAM CHECKLIST**

**WS-01: PROJECT SCAFFOLDING**

- Initialize monorepo with Turborepo: packages/core, packages/agents, apps/client, apps/api, apps/web

- Configure TypeScript, ESLint, Prettier, Husky pre-commit hooks

- Set up Docker Compose for local development (Postgres, Redis, MinIO)

- Create shared types package: User, Course, Lesson, Agent, Context interfaces

- Implement environment configuration (.env schema with Zod validation)

- Write project README with setup instructions

**WS-02: AUTHENTICATION & KEY MANAGEMENT**

- Implement auth service: register, login, JWT refresh, social OAuth (Google, GitHub, Apple)

- Build API key vault: CRUD operations with AES-256 encryption, provider validation

- Create key usage tracking middleware that counts tokens per agent per session

- Build auth middleware for REST and WebSocket with role-based access (free, pro, admin)

- Write unit and integration tests for all auth flows

**WS-03: ORCHESTRATOR AGENT**

- Implement Student Context Object schema and persistence layer

- Build context loader that assembles the SCO from database at session start

- Implement agent registry with capability matching

- Build DAG-based execution planner for parallel/serial agent spawning

- Implement response aggregator that merges multi-agent outputs

- Build behavioral tracker that updates SCO from interaction signals

- Integrate system prompt from Section 10 of the spec

- Write comprehensive prompt regression tests

**WS-04: COURSE BUILDER & CONTENT PIPELINE**

- Build topic decomposition module that breaks goals into concept hierarchies

- Implement multi-source web discovery (Google Search API, Semantic Scholar, arXiv)

- Build content extractor using Firecrawl with fallback to Playwright + Cheerio

- Implement quality scorer: authority, recency, relevance, readability

- Build attribution tracker with full provenance chain storage

- Implement deduplication via MinHash/SimHash

- Build lesson formatter that chunks content into <10-minute reads

- Build syllabus generator that structures lessons into modules with prerequisites

- Write integration tests with mock web content

**WS-05: CORE AGENTS (Notes, Research, Exam, Summarizer)**

- Notes Agent: implement Cornell, Zettelkasten, and flashcard formats; auto-generate from lesson content

- Research Agent: integrate Semantic Scholar API, arXiv, and general web for deep-dive research

- Exam Agent: generate multiple-choice, short-answer, and coding challenges; implement scoring and gap analysis

- Summarizer Agent: implement extractive and abstractive summarization with configurable length

- All agents: conform to Agent SDK interface, include manifest.json, \>80% test coverage

**WS-06: COLLABORATION & MINDMAP AGENTS**

- Collaboration Agent: peer matching algorithm based on goal/interest vectors; study group creation and messaging

- Mindmap Agent: knowledge graph data model (nodes, edges, mastery levels); CRUD operations; export as SVG/PNG

- Build real-time collaboration on shared mindmaps via CRDT (Yjs)

- Write E2E tests for collaboration flows

**WS-07: API LAYER**

- Implement all REST endpoints from Section 11.1

- Build WebSocket server with event protocol from Section 11.2

- Implement rate limiting per tier (free: 100 req/min, pro: 500 req/min)

- Add request validation (Zod schemas), error handling, and logging

- Generate OpenAPI spec and Swagger documentation

- Write load tests targeting 1000 concurrent users

**WS-08: CLIENT APPLICATION**

- Set up Flutter project with platform-specific configurations (macOS, Windows, iOS, Android)

- Implement design system: typography, colors, spacing, components (buttons, cards, inputs, chips)

- Build onboarding flow (6 screens per Section 5.2.1)

- Build home dashboard with course carousel, daily lessons, mindmap overview, streak stats

- Build conversation interface with markdown rendering, agent activity indicator, quick-action chips

- Build course view with syllabus, lesson reader, progress tracker

- Build mindmap explorer with D3.js-based interactive graph

- Build agent marketplace browser

- Build course marketplace browser

- Build profile and settings screens

- Implement offline caching for lessons (SQLite local store)

- Build platform-specific installers: .dmg, .exe/.msi, App Store, Play Store

- Write accessibility tests (screen reader, keyboard nav, high contrast)

**WS-09: MARKETPLACE**

- Build course publishing pipeline: create, quality check, set pricing, moderation queue, publish

- Implement Stripe integration for paid courses (checkout, payouts, refunds)

- Build course discovery: search, filter, sort, trending algorithm, personalized recommendations

- Build agent marketplace: submission form, security review pipeline, activation flow

- Build creator dashboard: analytics, earnings, course management

- Write E2E tests for purchase and publishing flows

**WS-10: SUBSCRIPTION & BILLING**

- Implement Pro subscription via Stripe (web) and App Store/Play Store IAP (mobile)

- Build managed API key pool for Pro subscribers

- Implement feature flags per tier (free vs pro capabilities)

- Build billing management UI: upgrade, downgrade, cancel, invoice history

- Implement Update Agent for Pro: scheduled topic monitoring and proactive notifications

- Write billing integration tests

**WS-11: MARKETING WEBSITE**

- Initialize Next.js 14 project with Tailwind CSS and Framer Motion

- Build homepage per Section 12.2: hero, features, pricing, social proof, CTA

- Build features page with detailed capability breakdowns and screenshots

- Build pricing page with interactive comparison table and FAQ

- Build download page with platform auto-detection

- Build blog with MDX support

- Implement SEO: meta tags, structured data, sitemap, robots.txt

- Set up PostHog analytics

- Deploy to Vercel with preview environments for PRs

- Write Lighthouse performance and accessibility tests

**WS-12: DOCUMENTATION**

- Build docs site (Nextra or Mintlify) with search

- Write Getting Started Guide with screenshots

- Write User Guide covering all features

- Write Agent SDK Reference with code examples

- Write API Reference (auto-generated from OpenAPI + manual guides)

- Write Course Creator Guide

- Write Privacy & Security documentation

- Write Architecture Guide for engineering team

**WS-13: TESTING & QA**

- Run full test suite across all workstreams

- Execute E2E test plan for top 10 user journeys

- Run agent prompt regression tests

- Execute load tests and fix performance bottlenecks

- Run security scan (OWASP ZAP) and remediate findings

- Run accessibility audit and fix issues

- Conduct cross-platform testing on all 4 OS targets

- Fix all critical and high-severity bugs

**WS-14: DEPLOYMENT & LAUNCH**

- Configure production infrastructure with auto-scaling

- Set up monitoring and alerting (Datadog/Grafana)

- Configure CDN for static assets and client downloads

- Submit iOS and Android apps to respective stores

- Publish macOS and Windows installers to download page

- Launch marketing website

- Publish documentation site

- Create launch announcement for blog and social channels

■ **QUALITY GATES (APPLY TO EVERY WORKSTREAM)**

- All code passes linting and formatting checks

- Unit test coverage \>85% for new code

- No TypeScript/Dart type errors

- All API endpoints have request/response validation

- All UI components are accessible (WCAG 2.1 AA)

- All agent prompts pass regression tests

- PROGRESS.md is updated after every completed workstream

■ **PROGRESS TRACKER FORMAT**

Maintain a PROGRESS.md file at the repo root with the following format for each workstream: workstream ID, status (Not Started / In Progress / Complete / Blocked), completion date, notes on any blockers or deviations from spec. At the top of the file, maintain an overall completion percentage and list of current blockers.

# 17. Appendix

## 17.1 Glossary

|                   |                                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| **Term**          | **Definition**                                                                   |
| BYOAI             | Bring Your Own AI — user provides their own LLM API key for free platform access |
| SCO               | Student Context Object — the aggregate of all tracked data about a learner       |
| Orchestrator      | Central agent that manages user interaction and spawns specialized agents        |
| Agent Mesh        | The network of containerized, independently deployable agents                    |
| Bite-sized Lesson | A structured learning unit designed for <10 minutes of reading                   |
| Knowledge Graph   | Visual representation of concepts and their relationships (the mindmap)          |
| DAG Planner       | Directed Acyclic Graph-based execution planner for parallel agent scheduling     |
| SCORM             | Shareable Content Object Reference Model — e-learning interoperability standard  |

## 17.2 Open Questions & Decisions Needed

39. Flutter vs React Native: conduct a 1-week spike to evaluate performance and developer experience on all 4 platforms

40. LLM provider fallback: should the platform provide a fallback LLM for BYOAI users whose keys fail, or strictly require their own?

41. Content licensing: establish legal review of web content usage for educational purposes under fair use provisions

42. Agent sandboxing: evaluate gVisor vs Firecracker for marketplace agent isolation

43. Monetization timeline: should Pro subscriptions launch with v1 or after user base reaches a threshold?

44. Open source strategy: determine which components (Agent SDK, client, core) should be open-sourced

_End of Specification_
