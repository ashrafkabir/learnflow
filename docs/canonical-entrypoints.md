# Canonical entrypoints (Iter165)

LearnFlow ships two separate Next.js apps:

- **Client app**: `apps/client` (student/creator/admin product)
- **Marketing / web**: `apps/web` (landing + pricing + docs teaser)

## Canonical URLs (local dev defaults)

- Client: `http://localhost:3001`
- Marketing/web: `http://localhost:3003`

## Routing notes

- The marketing site is the canonical home for public pages:
  - `/` (marketing home)
  - `/pricing`
  - `/features`
  - `/download`
  - `/blog`
  - `/about`
  - `/docs` (developer docs landing/teaser)

- The client app is the canonical home for product flows:
  - `/login`, `/register`
  - onboarding `/onboarding/*`
  - authenticated app `/dashboard`, `/conversation`, `/mindmap`, `/pipelines`, `/marketplace/*`, `/settings`

## Screenshot automation

Screenshot capture defaults to:

- `--base` → client URL (`http://localhost:3001`)
- `--baseWeb` → marketing URL (`http://localhost:3003`)

See `docs/surfaces.md` for the authoritative mapping.
