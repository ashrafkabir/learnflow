# Contributing

## Local dev

- Node: see `.nvmrc` / engines.
- Install: `npm install`

## Useful scripts

- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (or `npx tsc -p .`)
- Unit tests (Vitest): `npm test`
- Playwright E2E: `npx playwright test`

### Playwright: list available tests

To see all Playwright tests and their titles:

```bash
npx playwright test --list
```

Note: this repo does not rely on a system-installed `rg` (ripgrep). When you need ripgrep-like search, use:

```bash
node scripts/rg.mjs "your query" path/
```
