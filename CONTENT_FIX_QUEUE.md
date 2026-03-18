# Content Fix Queue (post-SQLite)

## 1. Previous/Next Lesson Navigation
In LessonReader.tsx:
- Fetch the full course (or pass lesson list via route state)
- At bottom of lesson, show "← Previous Lesson: [title]" and "Next Lesson: [title] →"
- Link to /courses/:courseId/lessons/:lessonId

## 2. Verify Main Content renders for new Workflow B courses
- Create a fresh course after SQLite migration
- Confirm lessons have rich Main Content section (not just objectives + takeaways)
- If empty, debug the LLM output vs parser

## 3. Content workflow is the DEFAULT
The pipeline.ts already uses Workflow B (searchTopicTrending → per-lesson searchForLesson → synthesize → review/edit → publish). Verify this works end-to-end with SQLite persistence.
