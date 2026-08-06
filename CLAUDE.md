Instructions for Claude Code working in this repository — Emberline, an AI-powered lead generation and outreach automation tool. Monorepo: `frontend/` (React, currently mock-backed) + `backend/` (Express/TypeORM; every provider integration always uses real keys — `DEBUG` only controls dev/observability behavior, see `frontend-integration.md` §11).

Read first when picking up backend work: `backend-plan.md` (phase-by-phase checklist), `working.md` (architecture/how it works), `dev-required.md` (manual steps only a human can do), `frontend-integration.md` (API contract for wiring the frontend to the real backend).

## Rules

- **No comments unless absolutely necessary.** Only add one when the *why* is genuinely non-obvious — a hidden constraint, a workaround for a specific bug, a subtle invariant. Never add a comment that just restates what the code already says.
- **After every response that touches files, list what changed.** One line per file, as a markdown link to its actual path. Deleted files get a ✗ appended to the line; created or edited files get nothing appended. Example:
  ```
  - [backend/src/lib/foo.ts](backend/src/lib/foo.ts)
  - [backend/src/lib/bar.ts](backend/src/lib/bar.ts) ✗
  ```
- **Write unit tests where relevant.** Pure logic (status-rank checks, template rendering, parsing/validation helpers, anything with no DB/network/queue dependency) gets a test in `backend/src/**/*.test.ts`, run via `npm run test --workspace=backend` (vitest). Don't write tests that need live Postgres/Redis/external APIs — those get a manual smoke test instead (see the verification notes per phase in `backend-plan.md`).

## Keep these docs updated

After a change, check whether it's relevant to any of these — only edit the ones actually affected, don't touch the others:

- `working.md` — architecture and behavior overview
- `dev-required.md` — manual steps only a human can do (DNS, dashboard config, real API keys)
- `frontend-integration.md` — the API contract the frontend will integrate against
