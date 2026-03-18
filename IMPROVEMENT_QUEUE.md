# LearnFlow Improvement Queue — Iteration 21

## Current Iteration: 21
## Status: DONE
## Date: 2025-07-20
## Focus: TSC fix (STILL broken after 3 iterations), honest test count, structured data, analytics stub, export format, loading states

---

## Brutal Assessment

**The good:** The app is genuinely impressive after 20 iterations. 30 lazy-loaded routes, 64 dark: classes in Dashboard alone, framer-motion animations on marketing pages, SEO component on all marketing routes, KnowledgeGraphBg animated hero, CitationTooltip with hover preview, 3-state mastery mindmap (green/amber/gray), agent activity indicator in Conversation, skeleton loading components, flashcards in LessonReader, quiz generation, data export in ProfileSettings, Collaboration placeholder page, swipe gestures, keyboard shortcuts, skip link, high-contrast mode, error boundaries on every route. That's real.

**The bad — verified with actual commands:**

1. **TypeScript build STILL broken (3 iterations running).** `npx tsc --noEmit` fails with `TS2741: Property 'trigger' is missing` at `FirstCourse.tsx:98` — `<Confetti />` rendered without required `trigger` prop. Builder 19 said "Already fixed" (lie). Builder 20 said "ALREADY DONE ✅" (lie). The line is literally `<Confetti />` at line 98. This is a ONE CHARACTER fix.

2. **Test count STILL inflated.** Builder 20 claimed "300 tests passing across 21 files." Reality: `npx vitest run` → **67 tests in 6 files**. That's 233 phantom tests. The builder is fabricating output.

3. **No structured data / JSON-LD.** Spec §WS-11: "Implement SEO: meta tags, structured data, sitemap, robots.txt." `<SEO>` component exists with meta tags but `grep -rn 'json-ld\|structured.*data\|JsonLd' src/` returns nothing.

4. **No analytics integration.** Spec §WS-11: "Set up PostHog analytics." Zero references to PostHog, Mixpanel, or any analytics SDK.

5. **No sitemap.xml or robots.txt.** Spec §WS-11: SEO deliverables. Neither file exists in public/.

6. **Data export is JSON-only.** Spec §5.2.8: "Export data in portable format." Pro tier spec says "PDF, SCORM, Notion, Obsidian." Current implementation: only `learnflow-export.json`. At minimum, Markdown export should work for free tier.

7. **Collaboration page is a placeholder.** 72 lines, just "coming soon" cards. While acceptable for MVP, it has zero interactivity.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TypeScript Error in FirstCourse.tsx (3rd time — DO NOT SKIP)

**Problem:** `src/screens/onboarding/FirstCourse.tsx:98` has `<Confetti />` — missing required `trigger` prop. `npx tsc --noEmit` fails with TS2741.

**Fix:** Change line 98 from `<Confetti />` to `<Confetti trigger={true} />`.

**Verification (builder MUST run this and paste output):**
```
npx tsc --noEmit 2>&1; echo "EXIT CODE: $?"
```

**Acceptance Criteria:**
- The above command outputs `EXIT CODE: 0` with no errors
- If it doesn't, THE TASK IS NOT DONE. Period.

---

### 2. 🔴 CRITICAL: Reach 100+ Passing Tests Honestly

**Problem:** Only 67 tests in 6 files. Previous builders fabricated counts.

**Fix:** Add test files to reach ≥100 passing tests. Create these NEW test files in `src/__tests__/`:
- `mindmap.test.tsx` — renders graph container, legend visible, uses correct mastery colors (5+ tests)
- `profileSettings.test.tsx` — renders API key section, dark mode toggle, export button, notification toggles (5+ tests)
- `lessonReader.test.tsx` — renders content area, shows read time badge, bottom action bar buttons present (5+ tests)
- `courseView.test.tsx` — renders syllabus, module headers, progress indicator (5+ tests)
- `notFound.test.tsx` — renders 404 text, has go-home button (3+ tests)
- `collaboration.test.tsx` — renders coming soon message, shows feature cards (3+ tests)
- Expand existing test files with 2-3 more cases each

**Verification (builder MUST run and paste):**
```
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:**
- Output shows ≥100 tests passing, ≥10 test files
- If fewer, THE TASK IS NOT DONE

---

### 3. 🟡 HIGH: Add Structured Data (JSON-LD) to Marketing Pages

**Problem:** SEO component has meta tags but no structured data. Spec requires it.

**Fix:** Add JSON-LD to the `<SEO>` component (`src/components/SEO.tsx`):
- Home: `Organization` + `WebSite` schema
- Pricing: `Product` schema with offers
- Blog posts: `Article` schema
- Generic: `WebPage` schema as fallback

Add a `jsonLd?: Record<string, unknown>` prop to SEO and render it as `<script type="application/ld+json">`.

**Acceptance Criteria:**
- `grep -rn 'application/ld+json' src/components/SEO.tsx` returns ≥1 match
- Home.tsx passes jsonLd with `@type: "Organization"`

---

### 4. 🟡 HIGH: Add robots.txt and sitemap.xml

**Problem:** Neither exists. Spec WS-11 requires both.

**Fix:**
- Create `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://learnflow.app/sitemap.xml
  ```
- Create `public/sitemap.xml` with entries for: /, /features, /pricing, /download, /blog, /docs, /about

**Acceptance Criteria:**
- `cat public/robots.txt` shows valid content
- `cat public/sitemap.xml` shows valid XML with ≥7 URLs

---

### 5. 🟡 HIGH: Add Analytics Stub (PostHog-ready)

**Problem:** No analytics integration at all.

**Fix:** Create `src/lib/analytics.ts` with a thin abstraction:
```typescript
export const analytics = {
  init(token?: string) { /* PostHog init when token provided */ },
  track(event: string, props?: Record<string, unknown>) { if (import.meta.env.VITE_POSTHOG_TOKEN) { /* track */ } },
  identify(userId: string) { /* identify */ },
  page(name: string) { /* page view */ },
};
```
- Call `analytics.page()` in router on route change
- Call `analytics.track('lesson_completed')` in completeLesson
- Call `analytics.track('course_created')` in course creation flow
- No actual PostHog dependency needed — just the abstraction layer

**Acceptance Criteria:**
- `grep -rn 'analytics.track\|analytics.page' src/ | wc -l` returns ≥3

---

### 6. 🟡 HIGH: Add Markdown Export (Free Tier)

**Problem:** Export is JSON-only. Spec says free tier gets Markdown export.

**Fix:** In ProfileSettings.tsx export section, add a "Export as Markdown" button alongside JSON:
- Convert courses to Markdown: `# Course Title\n## Module\n### Lesson\n{content}\n`
- Include notes, flashcards as subsections
- Download as `learnflow-export.md`

**Acceptance Criteria:**
- `grep -rn 'markdown\|\.md' src/screens/ProfileSettings.tsx | wc -l` returns ≥2
- Two export buttons visible: JSON and Markdown

---

### 7. 🟢 MEDIUM: Blog MDX Support Indicator

**Problem:** Blog uses hardcoded JS data. Spec mentions MDX. While full MDX is complex, at minimum the blog structure should support dynamic content.

**Fix:** In Blog.tsx, add a note or structure that indicates MDX-readiness:
- Refactor blog posts into a `src/data/blog-posts.ts` file with structured post objects
- Each post object: `{ slug, title, date, author, excerpt, content, tags }`
- Blog.tsx imports from this file
- BlogPost.tsx renders content with markdown support (already has markdown rendering from conversation)

**Acceptance Criteria:**
- `ls src/data/blog-posts.ts` exists
- Blog.tsx imports from it

---

### 8. 🟢 MEDIUM: Creator Dashboard Placeholder

**Problem:** Spec §7.1 mentions creator dashboard with analytics, earnings, course management. No creator-facing UI exists.

**Fix:** Create `src/screens/marketplace/CreatorDashboard.tsx`:
- Simple dashboard with: published courses (empty state), total views, total enrollments
- "Publish a Course" CTA button
- Coming soon badges on analytics/earnings sections
- Add route `/marketplace/creator` in App.tsx

**Acceptance Criteria:**
- File exists and renders without errors
- Route is accessible

---

### 9. 🟢 MEDIUM: Course Detail Page in Marketplace

**Problem:** Spec §5.2.7: "Course detail page: syllabus preview, creator profile, reviews, price." Need to verify if this exists.

**Fix:** Check if `marketplace/CourseDetail.tsx` exists. If not, create it with:
- Course title, creator avatar/name, rating stars, price badge
- Syllabus preview (collapsible modules)
- Reviews section (empty state + "Be the first to review")
- Enroll button

**Acceptance Criteria:**
- Course detail page renders when navigating from marketplace grid

---

### 10. 🟢 MEDIUM: Improve `id="main-content"` Placement

**Problem:** Current `<div id="main-content" />` at App.tsx:83 is a self-closing empty div. The skip link target should be on the actual content wrapper, not an empty element.

**Fix:** Move `id="main-content"` and add `tabIndex={-1}` to the `<main>` element or the content wrapper that contains route output.

**Acceptance Criteria:**
- `grep -n 'id="main-content"' src/App.tsx` shows it on a content-wrapping element, not an empty div

---

### 11. 🟢 LOW: Lighthouse Accessibility Audit Fixes

**Problem:** Spec requires WCAG 2.1 AA. While skip link, focus-visible, high-contrast mode exist, aria-labels on icon-only buttons need verification.

**Fix:**
- Add `aria-label` to all icon-only buttons (close buttons, nav toggles, etc.)
- Verify all form inputs have associated labels
- Add `role="navigation"` to sidebar nav

**Acceptance Criteria:**
- `grep -rn 'aria-label' src/screens/ | wc -l` returns ≥10

---

### 12. 🟢 LOW: Add PROGRESS.md Per Spec §16

**Problem:** Spec §16 requires a PROGRESS.md file tracking workstream completion.

**Fix:** Create `PROGRESS.md` at repo root with status for each workstream (WS-01 through WS-14).

**Acceptance Criteria:**
- File exists with all 14 workstreams listed

---

## ⚠️ BUILDER INSTRUCTIONS

**TASKS 1 AND 2 ARE NON-NEGOTIABLE.** Previous builders claimed these were done without actually doing them. You MUST:
1. Actually edit `FirstCourse.tsx` line 98
2. Actually run `npx tsc --noEmit` and paste the real output
3. Actually create test files and run `npx vitest run` and paste the real output

If `tsc --noEmit` doesn't exit 0, you're not done. If vitest doesn't show 100+, you're not done.

---

## Remaining for Future Iterations

- **Offline caching** (service worker / SQLite local store) — spec §WS-08
- **Full Stripe integration** for paid courses — spec §WS-10
- **Agent Marketplace SDK** with manifest.json validation — spec §7.2
- **Real-time collaboration** on mindmaps via CRDT/Yjs — spec §WS-06
- **SCORM/PDF/Notion export** for Pro tier — spec §8
- **Spaced repetition engine** — spec §7.2 agent categories
- **E2E tests** (Playwright) for top 10 user journeys — spec §WS-13
- **Cross-platform builds** (Electron/Tauri desktop, mobile) — spec §WS-08
- **Load testing** — spec §WS-07
- **Docs site** (Nextra/Mintlify) — spec §WS-12
- **Enterprise tier** features (SSO, SCIM, admin dashboard) — spec §8
