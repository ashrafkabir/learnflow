# BUILD_LOG — Planner 3

## Actions Taken
1. Read IMPROVEMENT_QUEUE.md (iteration 2) and ITERATE.md
2. Checked running processes — API (port 3002) and client (port 3001) running in tmux
3. Listed all UI and API files
4. Took Playwright screenshots of: dashboard, onboarding (welcome/sub/first-course/base), conversation, settings, mindmap
5. Took screenshots of: course view, lesson reader, authenticated dashboard
6. Read Conversation.tsx — confirmed react-markdown + remark-math + rehype-katex + rehype-highlight installed ✅
7. Read courses.ts — LLM path exists but all existing courses have template fallback content (527 words, generic)
8. Read chat.ts — LLM path exists for notes/quiz but client doesn't send lessonId/courseId
9. Confirmed OPENAI_API_KEY is available in API process env
10. **CRITICAL FINDING**: Client API calls (apiPost/apiGet) don't send Authorization headers — all protected routes return 401 silently
11. Course view and lesson reader render blank (stuck on loader) because API returns 401
12. Dashboard shows "No courses yet" because courses endpoint returns 401
13. Onboarding base `/onboarding` now correctly redirects to `/onboarding/welcome` ✅
14. Conversation has proper markdown rendering ✅ but sendChat doesn't pass lessonId/courseId context
15. Notes/quiz via direct API call with auth token returns template content (LLM fallback used, content too short/generic)

## Key Findings
- **Auth is completely broken on client** — no Bearer token sent
- **Content is all template fallback** — LLM generation may be failing or was never invoked for existing courses
- **Course view and lesson reader are blank** — 401 responses
- **Dashboard doesn't list courses** — 401 responses
- **Notes/quiz are template quality** — even when LLM is available
- **Conversation doesn't pass lesson context** — notes/quiz can't be lesson-specific

## Output
Wrote IMPROVEMENT_QUEUE.md with 13 prioritized tasks for iteration 3.
