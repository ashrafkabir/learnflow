# Improvement Queue — Iter146 (Planner)

Status: DONE

Scope focus:

- External accessibility: validate/document remote access (LAN + tunnel)
- Verify LessonReader UX after Iter144/145 is still correct

## P0 (must fix)

1. **Fix Playwright LessonReader regressions: `Take Notes` label + right-rail testids**
   - Current E2E failures: `iter134-lesson-reader-ux`, `iter135-lesson-reader-sources-rail`, `lesson-map`.
   - Root cause: LessonReader redesign removed `aria-label="Take Notes"` and `[data-testid="lesson-right-rail"]`.
   - Options:
     - Update E2E selectors to new UI strings (e.g., `Open notes`) + new testids, OR
     - Re-introduce compatibility hooks: add a hidden/accessible button with aria-label `Take Notes`, restore `data-testid="lesson-right-rail"` on the drawer container.

2. **Make API bind address explicit for remote access clarity**
   - Client already binds `0.0.0.0:3001` via `vite.config.ts (host:true)`.
   - API in `apps/api/src/index.ts` uses `server.listen(config.port)` (not explicit).
   - Make it explicit (`'0.0.0.0'`) and update logging to state LAN usage.

3. **Ship user-facing remote access doc**
   - Add `REMOTE_ACCESS.md` (or merge into `TROUBLESHOOTING.md`) covering:
     - why `0.0.0.0` isn’t browseable
     - LAN IP discovery
     - cloudflared quick tunnel + URL rotation

## P1 (should do)

4. **LessonReader: re-assert spec-required “action chips”**
   - Spec/E2E expects: Mark Complete + Notes + Quiz + Ask.
   - New drawer consolidates actions; ensure these actions are still easily discoverable (esp. first-time users).

5. **LessonReader: add stable test hooks for rails/drawer**
   - Add `data-testid` for:
     - lesson drawer container (right rail)
     - actions section
     - notes section open button
     - sources section link list

6. **Remote access: confirm `/ws` proxy works through tunnel**
   - Provide a simple manual checklist:
     - open tunneled URL
     - send chat message
     - confirm streaming works

7. **Remote access: document firewall + Wi‑Fi isolation gotchas**
   - Common failures: UFW closed ports, guest Wi‑Fi blocks peer access.

8. **Add a one-command “share” script**
   - e.g., `npm run share` → runs `cloudflared tunnel --url http://localhost:3001` and prints URL.

## P2 (nice-to-have)

9. **API/base URL ergonomics for LAN**
   - Consider a helper UI in Settings showing “Your LAN URL” (computed from `window.location.hostname`) and copy button.

10. **Tighten docs taxonomy**

- Add `TROUBLESHOOTING.md` that links to `DEV_PORTS.md`, `REMOTE_ACCESS.md`, and common env vars.

11. **Add a smoke test for remote binding**

- Node test that asserts Vite config sets `host:true` and API listen is explicit (if changed).

12. **Ensure lesson drawer is keyboard navigable**

- Verify accordion buttons have correct roles/aria-expanded.

13. **Update spec compliance suite to track redesign**

- Align selectors/expectations with new LessonReader UI while keeping user-visible semantics.

14. **Add screenshots for remote access docs**

- Show `ip addr` and cloudflared log snippet with URL.

15. **Remove/clarify legacy `apps/api/src/server.ts`**

- It binds 3002 with `devMode:true`, but isn’t used by standard dev.
- Either delete, or label as legacy/test-only to avoid confusion.
