# Surfaces (routes) → Screenshot mapping (Iter165)

This repo has two user-facing surfaces:

- **Client app** (`apps/client`) — typically served at `http://localhost:3001` in dev
- **Marketing / web** (`apps/web`) — typically served at `http://localhost:3003` in dev

The screenshot automation is designed to capture both, to avoid gaps in MVP evidence.

## Screenshot scripts

- `scripts/screenshots.mjs`
  - Runs desktop + mobile screenshot capture.
  - Desktop capture includes:
    - **Client** routes (via `--base`, default `http://localhost:3001`)
    - **Marketing/web** routes (via `--baseWeb`, default `http://localhost:3003`)
  - Guardrail: exits non-zero if required screenshots are missing (unless `--skipMarketing 1`).

- `screenshot-all.mjs`
  - Desktop screenshots: client + marketing

- `screenshot-mobile.mjs`
  - Mobile screenshots: client

## Desktop screenshots (Iter165)

### Marketing / web (apps/web)

| Screenshot file | Route |
|---|---|
| `marketing-home.png` | `/` |
| `marketing-features.png` | `/features` |
| `marketing-pricing.png` | `/pricing` |
| `marketing-download.png` | `/download` |
| `marketing-blog.png` | `/blog` |
| `marketing-about.png` | `/about` |
| `marketing-docs.png` | `/docs` |

### Client public (apps/client)

| Screenshot file | Route |
|---|---|
| `landing-home.png` | `/` |
| `auth-login.png` | `/login` |
| `auth-register.png` | `/register` |
| `onboarding-1-welcome.png` | `/onboarding/welcome` |
| `onboarding-2-goals.png` | `/onboarding/goals` |
| `onboarding-3-topics.png` | `/onboarding/topics` |
| `onboarding-4-api-keys.png` | `/onboarding/api-keys` |
| `onboarding-5-subscription.png` | `/onboarding/subscription` |
| `onboarding-6-first-course.png` | `/onboarding/first-course` |

### Client authed (apps/client)

| Screenshot file | Route |
|---|---|
| `app-dashboard.png` | `/dashboard` |
| `app-conversation.png` | `/conversation` |
| `app-mindmap.png` | `/mindmap` |
| `app-pipelines.png` | `/pipelines` |
| `pipeline-detail.png` | `/pipelines/:id` |
| `lesson-reader.png` | `/courses/:id/lessons/:lessonId` |
| `marketplace-courses.png` | `/marketplace/courses` |
| `marketplace-agents.png` | `/marketplace/agents` |
| `marketplace-creator-dashboard.png` | `/creator/dashboard` |
| `app-settings.png` | `/settings` |
| `settings-about-mvp-truth.png` | `/about-mvp-truth` |

## Mobile screenshots

See `screenshot-mobile.mjs` for the current mobile route set and output naming.

## Notes

- If a route changes, update:
  1) the relevant screenshot script, and
  2) this mapping doc.
- In CI, treat missing screenshots as a build failure to prevent placebo "evidence".
