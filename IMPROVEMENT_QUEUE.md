# LearnFlow Improvement Queue — Iteration 14

## Current Iteration: 14
## Status: DONE
## Date: 2025-07-18
## Focus: Lesson content quality, design system tokens, primary action clarity, mobile fixes

---

## Brutal Assessment

After 13 iterations, LearnFlow has solid scaffolding — nice card layouts, working navigation, marketplace, mindmap, AI chat. But three **fundamental problems** remain that make this feel like a prototype, not a product:

1. **Lesson content is garbage.** The `synthesizeFromSources()` function is a keyword-extraction template — not AI synthesis. It produces robotic text like "Recurring themes include: quantum, computing, measurement..." followed by "This source is useful for understanding X." There's no Feynman-style explanation, no analogies, no ASCII diagrams, no "Frontiers & Open Questions" section. The spec promises bite-sized mastery content; the app delivers a bibliography with filler sentences. **This is the #1 problem.**

2. **No design system tokens.** After 13 iterations of cosmetic fixes, colors/radii/shadows are STILL inconsistent across screens. Every iteration patches individual screens instead of fixing the root cause: there are no shared CSS custom properties. Blues vary, radii vary, shadows vary. This will never be fixed by screen-by-screen patches.

3. **Dashboard has no clear primary action.** First-time users see 6+ competing cards with no hierarchy. There's no "Resume your next lesson" hero CTA. The empty states still say "No activity yet" with no actionable guidance.

---

## Prioritized Tasks (13 items)

### 1. ✅ DONE: Rewrite Lesson Synthesis to Use LLM

**Problem:** `packages/agents/src/content-pipeline/firecrawl-provider.ts` `synthesizeFromSources()` uses keyword extraction + template strings. Output is a mechanical list of "What to learn from [source]" with zero educational value. No analogies, no simplified explanations, no diagrams, no engagement. This violates the core product promise.

**Fix:**
- Replace the template-based synthesis with an actual LLM call (OpenAI/Anthropic via user's API key)
- System prompt should enforce Feynman/Kurzgesagt style: explain like you're teaching a curious friend, use analogies, include ASCII diagrams where helpful, add a "🔭 Frontiers & Open Questions" section
- Target 900-1400 words per lesson
- Keep inline citations from sources but synthesize actual educational prose, not source summaries
- Fallback to current template if no API key is configured

**Acceptance Criteria:**
- Generated lesson reads like a blog post, not a bibliography
- Contains at least one analogy or metaphor per lesson
- Contains "🔭 Frontiers & Open Questions" section
- 900-1400 word range
- Inline citations preserved from sources
- Works with both OpenAI and Anthropic keys

---

### 2. 🔴 CRITICAL: Design System Tokens (CSS Custom Properties)

**Problem:** 13 iterations of fixing "inconsistent blues" and "different radii" have not solved the problem because there's no single source of truth. Each screen defines its own colors inline or via Tailwind classes.

**Fix:**
- Create `apps/client/src/styles/tokens.css` with CSS custom properties:
  ```
  --color-primary: #2563EB
  --color-primary-hover: #1D4ED8
  --color-secondary: #7C3AED
  --color-success: #16A34A
  --color-error: #DC2626
  --color-warning: #F59E0B
  --radius-button: 8px
  --radius-card: 12px
  --radius-input: 8px
  --radius-modal: 16px
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04)
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08)
  --shadow-modal: 0 8px 30px rgba(0,0,0,0.12)
  ```
- Extend Tailwind config to use these tokens
- Replace ALL ad-hoc color/radius/shadow values across every screen with token references
- Dark mode variants for all tokens

**Acceptance Criteria:**
- `grep -r "bg-blue\|bg-\[#\|border-\[#\|shadow-\[" apps/client/src/ --include="*.tsx" | grep -v tokens` returns zero results (all values come from tokens)
- Every button, card, input, and modal uses token-based styling
- Changing `--color-primary` in one place changes it everywhere
- Dark mode works correctly with token overrides

---

### 3. 🔴 CRITICAL: Dashboard Primary Action Hero

**Problem:** Dashboard shows 6+ equal-weight cards. New users have no idea what to do first. There's no "Resume your next lesson" or "Start here" CTA.

**Fix:**
- Add a hero section at the top of dashboard:
  - If user has courses in progress: "Continue Learning" card with the next incomplete lesson, title, estimated time, and a prominent "Resume →" button
  - If user has no courses: "Start Your Learning Journey" with a prominent "Create Your First Course" button and 3 topic suggestion chips
- Reduce visual weight of secondary cards (stats, notifications, weekly activity)
- Empty "This Week" chart: replace "No activity yet" with a faded chart skeleton + "Complete your first lesson to see progress here"

**Acceptance Criteria:**
- First thing visible on dashboard is ONE clear primary action
- Hero CTA is visually dominant (larger, primary color, more padding than any other element)
- Empty states have actionable CTAs that link to relevant screens
- Returning users see their next lesson prominently

---

### 4. 🔴 CRITICAL: Mobile Overflow & Safe Area Fixes

**Problem:** On 375px viewport: course creation row overflows, header icons too small/close, chat input not sticky, no safe-area handling.

**Fix:**
- Dashboard header: `flex-wrap: wrap` on course input row, stack vertically on mobile
- All icon buttons: `min-height: 44px; min-width: 44px`
- Chat input: `position: sticky; bottom: 0; padding-bottom: env(safe-area-inset-bottom)`
- Add `overflow-x: hidden` on main containers
- Test at 320px, 375px, 414px

**Acceptance Criteria:**
- Zero horizontal overflow at any width ≥ 320px
- All interactive elements ≥ 44px tap target
- Chat input always visible at bottom on mobile
- No content hidden behind sticky headers

---

### 5. 🟡 HIGH: Text Contrast & Focus States (Accessibility)

**Problem:** Secondary text uses `text-gray-400`/`text-gray-500` which fails WCAG AA on white. No visible keyboard focus states. Mindmap legend uses color-only indicators.

**Fix:**
- Replace all `text-gray-400`/`text-gray-500` body text with `text-gray-600` minimum
- Add global `:focus-visible` style: `outline: 2px solid var(--color-primary); outline-offset: 2px`
- Add text labels to mindmap legend dots
- Run axe-core audit, fix all critical/serious violations

**Acceptance Criteria:**
- All text meets 4.5:1 contrast ratio on light backgrounds
- Tab through entire app shows visible focus ring on every interactive element
- Zero critical/serious axe-core violations

---

### 6. 🟡 HIGH: Mindmap Readability

**Problem:** Node labels tiny and truncated, connectors hairline-thin, canvas wasted inside padded card, no zoom-to-fit.

**Fix:**
- Node labels: 14px minimum, allow 2-line wrapping with `line-clamp-2`
- Tooltips on hover showing full title
- Connector stroke: 2px, color `#94A3B8`
- Remove outer card padding — canvas uses full width
- Add zoom-to-fit button on initial load

**Acceptance Criteria:**
- All labels readable without zooming
- Connectors clearly visible
- Canvas uses ≥90% available width
- Zoom-to-fit works on load

---

### 7. 🟡 HIGH: Settings Page 2-Column Layout

**Problem:** Single-column scroll-fest on desktop. Inconsistent button styles. PRO badges vary. API key placeholder reveals pattern.

**Fix:**
- Desktop (≥768px): 2-column CSS grid
- Unify all Save buttons to primary token style
- Standardize PRO badges: same size, same purple color
- API key mask: `••••••••••••`
- Consistent form spacing: 16px label-to-input, 24px between groups

**Acceptance Criteria:**
- 2-column on desktop, single column on mobile
- All Save buttons identical
- All PRO badges identical
- Page scroll reduced ~30% on desktop

---

### 8. 🟡 HIGH: Unified Button Component

**Problem:** Buttons across the app use different sizes, radii, shadows, gradients. Login has gradient blue, settings has flat blue, onboarding has another gradient. Some CTAs are purple.

**Fix:**
- Create a `<Button>` component with variants: `primary`, `secondary`, `ghost`, `danger`
- All variants use design tokens from task #2
- Replace every `<button>` and styled CTA across all screens with this component
- Consistent height: 40px default, 48px large

**Acceptance Criteria:**
- Single `Button` component used everywhere
- No ad-hoc button styling in any screen file
- Visual audit: all primary buttons look identical across all screens

---

### 9. 🟠 MEDIUM: Marketplace Filter Alignment & Grid

**Problem:** Search bar, dropdown, and filter pills have different heights/radii. Large empty space on right. "All" pill indistinguishable from inactive pills.

**Fix:**
- Align all filter controls to same height (40px)
- Unify border-radius across search, dropdown, and pills
- Active pill: solid primary color fill (not just outline)
- Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile with no wasted space

**Acceptance Criteria:**
- All filter controls same height
- Active filter clearly distinguishable
- Grid fills available width with no large empty gutters

---

### 10. 🟠 MEDIUM: Onboarding Visual Consistency

**Problem:** Progress dots small/low-contrast. Brain icon inconsistent size across screens. Feature list spacing excessive. "Get Started" uses different blue than rest of app.

**Fix:**
- Progress dots: 32px, darken inactive to `text-gray-400`
- Brain icon: same 48px size everywhere
- Feature list gap: 12px
- Apply primary button token to "Get Started"

**Acceptance Criteria:**
- Progress dots visible and tappable
- Brain icon identical across all screens
- CTA matches primary button style from design tokens

---

### 11. 🟠 MEDIUM: Course Title 2-Line Clamp + Tooltips

**Problem:** Titles truncate to 1 line losing meaning. Progress bar alignment inconsistent.

**Fix:**
- `-webkit-line-clamp: 2` on all course titles
- `title` attribute for native hover tooltip
- Progress bar: consistent 6px height, left title + right percentage

**Acceptance Criteria:**
- Titles show 2 lines before truncating
- Full title on hover
- Progress bars aligned consistently

---

### 12. 🟠 MEDIUM: Landing Page Metrics Single Source of Truth

**Problem:** "50K+" in hero vs "50k+" in footer. "4.9★" vs "4.8" in different sections.

**Fix:**
- Create `METRICS` constant: `{ learners: '50,000+', rating: '4.9', satisfaction: '98%' }`
- Use everywhere — hero, trust section, footer
- Remove duplicate stat displays

**Acceptance Criteria:**
- Single source of truth for all metrics
- No conflicting numbers anywhere

---

### 13. 🟠 MEDIUM: Login/Register Polish

**Problem:** Excessive whitespace above login card. No password show/hide toggle. Input borders too subtle. "Sign up" link too far from card.

**Fix:**
- Reduce top margin ~30% for better vertical centering
- Add show/hide password toggle
- Input borders: `border-gray-300` instead of `border-gray-200`
- Sign-up link: 12px gap from card instead of 24px

**Acceptance Criteria:**
- Login form well-centered vertically
- Password toggle visible and functional
- Inputs look like editable fields
- Sign-up link visually connected to card

---

## Remaining for Future Iterations (Post-14)

- PWA offline support & service worker
- Skeleton loading screens for marketplace and conversation
- Mobile hamburger nav for app screens
- Horizontal scroll for filter chips on mobile marketplace
- Collaboration Agent peer matching UI
- Export Agent (PDF, SCORM, Notion, Obsidian)
- Playwright E2E tests for all user journeys
- Creator dashboard with analytics
- CRDT shared mindmap (Yjs)
- Flashcard deck UI
- Course progress email digests
- Social sharing
- Gamification: badges, levels, leaderboard
- Performance audit (Lighthouse ≥90)
- Dark mode comprehensive audit
- PostHog analytics initialization
- Documentation site
