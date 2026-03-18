# Build Log: AI Chat + Rich Notes Features

## Feature 1: All Conversations Routed Through AI ✅

### Changes:

- **`apps/api/src/routes/chat.ts`** — Rewrote `generateChatResponse()` to use OpenAI (gpt-4o-mini) for all general chat messages
  - Builds system prompt with course title, lesson title, and lesson content (trimmed to 3000 chars)
  - Passes conversation history (last 10 messages) for multi-turn context
  - Falls back to helpful menu if OpenAI unavailable
- **`apps/client/src/context/AppContext.tsx`** — `sendChat()` now sends `history` (last 10 messages with role/content) alongside courseId/lessonId

### Testing:

- Tested chat without lesson context → AI responds with general educational help
- Tested chat with courseId/lessonId → AI responds with lesson-aware answers (verified Kubernetes pod question)

## Feature 2: Rich Notes with Generated Illustrations ✅

### 2a. AI-Generated Notes ✅

- **`apps/api/src/routes/courses.ts`** — Added `POST /:id/lessons/:lessonId/notes` endpoint supporting formats:
  - `summary` — AI concise summary
  - `cornell` — AI Cornell-style notes (cues, notes, summary)
  - `mindmap` — AI hierarchical outline
  - `custom` — user writes their own
- **`apps/client/src/screens/LessonReader.tsx`** — Enhanced notes panel with:
  - Three AI generation buttons (Summary, Cornell, Mind Map)
  - Custom notes textarea with auto-save on blur
  - Display of AI-generated notes with markdown rendering

### 2b. Generated Illustrations ✅

- **`apps/api/src/routes/courses.ts`** — Added `POST /:id/lessons/:lessonId/notes/illustrate` endpoint
  - Uses DALL-E 3 API (1024x1024, standard quality)
  - Saves illustrations to notes in SQLite
- **`apps/client/src/screens/LessonReader.tsx`** — Added illustration panel:
  - Text input for description
  - Generate button
  - Grid display of generated images

### 2c. Notes Persistence ✅

- **`apps/api/src/db.ts`** — Added `notes` table (id, lessonId, userId, content JSON, illustrations JSON, createdAt, updatedAt)
  - Prepared statements: upsertNote, getNoteByLessonUser, deleteNote
  - `dbNotes` helper with get/save/delete methods
- **`apps/api/src/routes/courses.ts`** — CRUD endpoints:
  - `GET /:id/lessons/:lessonId/notes` — load saved notes
  - `POST /:id/lessons/:lessonId/notes` — create/generate notes
  - `PUT /:id/lessons/:lessonId/notes` — update notes
- **Client** loads saved notes on lesson open; auto-saves on blur

## Test Results

- **16 test files, 262 tests — ALL PASSED** ✅
- API server starts cleanly on port 3000
- Client dev server starts on port 3001
