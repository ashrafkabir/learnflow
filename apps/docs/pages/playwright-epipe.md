# Playwright piping + EPIPE (Node 22+)

If you run Playwright commands that emit a lot of output and **pipe** them to another command (e.g. `head`), the downstream process may close the pipe early. In Node 22+ this can surface as an **unhandled `EPIPE`** error when the writer continues to write to `stdout`/`stderr`.

A common example:

```bash
npx playwright test --list | head
```

## LearnFlow solution

Use the repo script wrapper instead:

```bash
npm run pw:list | head
```

This runs Playwright in a child process and swallows `EPIPE` errors on stdout/stderr so piping is safe.

- Script: `scripts/playwright-list.mjs`
- npm script: `pw:list` (see root `package.json`)

## Why we keep this

This is a small dev-experience hardening step. It prevents confusing local failures while keeping the underlying Playwright behavior unchanged.
