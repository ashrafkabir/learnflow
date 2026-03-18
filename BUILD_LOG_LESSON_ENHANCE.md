# Build Log: Lesson Content Enhancement Features

## Status: ✅ Complete

## Features Implemented

### Feature 1: Inline Illustrations on Demand
- **UI**: "🎨 Illustrate" button appears on hover next to each `### heading` in Main Content sections
- Clicking opens a popover with auto-suggested prompt (based on heading text) and editable text field
- Generates via DALL-E 3 API, displays inline below the section with caption and delete button
- **API**: `POST/GET/DELETE /api/v1/courses/:id/lessons/:lessonId/illustrations`
- **DB**: New `illustrations` table (id, lessonId, sectionIndex, prompt, imageUrl, createdAt)

### Feature 2: Comparison Mode
- **UI**: "⚖️ Compare" button in lesson header toolbar (next to bookmarks)
- Sends lesson content to OpenAI to identify comparable concepts
- Renders side-by-side cards (2 concepts) or comparison table (3+)
- Cached in localStorage per lessonId, with regenerate option
- **API**: `POST /api/v1/courses/:id/lessons/:lessonId/compare`

### Feature 3: Text-Anchored Notes (Annotations)
- **UI**: Selecting text in lesson content shows floating toolbar with "📝 Note", "🔍 Explain", "💡 Example" buttons
- "Note" prompts for user text; "Explain" and "Example" call OpenAI for AI-generated content
- Annotations displayed in a dedicated section below content with yellow highlight styling
- Click to expand/view note, delete option
- **API**: `POST/GET/DELETE /api/v1/courses/:id/lessons/:lessonId/annotations`
- **DB**: New `annotations` table (id, lessonId, selectedText, startOffset, endOffset, note, type, createdAt)

## Files Modified
- `apps/api/src/db.ts` — Added illustrations + annotations tables, prepared statements, helpers
- `apps/api/src/routes/courses.ts` — Added 7 new endpoints (illustrations CRUD, compare, annotations CRUD)
- `apps/client/src/screens/LessonReader.tsx` — Added all three features with UI components

## Tests
- `npx tsc --noEmit`: Only pre-existing error (BetterSqlite3 type export)
- `npx vitest run`: 262/262 tests passed (16 files)
- API server starts on port 3000, client on port 3001
