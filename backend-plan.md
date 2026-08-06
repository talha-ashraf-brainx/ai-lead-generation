# Backend Build Plan
## AI-Powered Lead Generation and Outreach Automation

Stack: Node.js (Express) + PostgreSQL + BullMQ (Redis). Built phase by phase, mirroring the frontend modules in `frontend-plan.md`.

- Real integrations (Apollo/Hunter, OpenAI, Resend, Slack) are stubbed by `SEED_MODE` during dev so credits aren't burned.
- Postgres/Redis run locally (Homebrew) until deploy, when a managed provider takes over (Phase 10).
- npm workspaces monorepo, alongside `frontend/`.

---

## Phase 0 — Foundation
- [x] Express scaffold, npm workspaces, core middleware
- [x] Postgres + TypeORM setup, initial migration
- [x] `.env` config, base folder structure

---

## Phase 1 — Auth
- [x] `User` entity + migration
- [x] JWT auth (`jsonwebtoken` + `bcryptjs`), httpOnly cookie, protected-route middleware
- [x] Password reset (token dev-logged while `SEED_MODE=true`; real email lands in Phase 7)

Single-user app, no self-serve signup.

---

## Phase 2 — Lead Input
- [x] Leads schema/migration (company, contact, email, website, status)
- [x] CSV import (`POST /api/leads/csv/preview`, `/csv/import`) — PapaParse, dedup by email
- [x] Keyword/location search (`POST /api/leads/search`, seed-mode synthetic leads for now) + job status endpoint

Real Apollo/Hunter search lands in Phase 3 (enrichment only, not discovery).

---

## Phase 3 — Lead Enrichment
- [x] Apollo (primary) / Hunter (fallback) client integration
- [x] Enrichment job per lead — status (pending/enriched/failed), in-process retry with backoff, manual retry via `POST /api/leads/:id/enrich`
- [x] Seed mode: 90% simulated success

Search-sourced leads auto-enqueue for enrichment; CSV leads stay `enriched`. Real *discovery* by niche/location is still seed-only.

---

## Phase 4 — AI Email Generation
- [x] OpenRouter integration via `openai` SDK (JSON-mode), prompt uses company/industry/pain-point
- [x] `POST /api/email-drafts/:leadId/generate` (also regenerates) + `/bulk-generate`
- [x] Draft storage (`email_drafts`, FK→leads cascade), `GET`/`PATCH` for edit/approve

Seed mode rotates templates instead of calling the LLM.

---

## Phase 5 — Sending & Follow-ups
- [x] Resend client, message ID tracking per send
- [x] BullMQ + Redis queue (`emailQueue.ts`/`emailWorker.ts`, worker runs in-process for now)
- [x] Day3/day7 follow-ups, created lazily, skipped if lead already replied/converted. Seed mode: 15s/30s instead of 3/7 days
- [x] Resend webhook (`POST /api/webhooks/resend`) — opens/clicks/bounces/failures, Svix-signature-verified, matched via `campaignSendId` tag

`POST /api/campaigns` snapshots each lead's approved draft and queues the initial send. Verified in seed mode: send → open → day3 → day7, and reply correctly halts the sequence before day7.

---

## Phase 6 — Reply Detection & Status
- [x] Forward-only status ranking (contacted → opened → replied → converted); `converted` is manual-only
- [x] Inbound email webhook (`POST /api/webhooks/resend-inbound`), Svix-signature-verified (`email.received` event)
- [x] Manual overrides: `PATCH /api/leads/:id/status`, `PATCH /api/campaigns/:id/status`

Each send sets a per-send reply address so an inbound reply maps back to the exact lead. Verified: reply flips status correctly, never downgrades an already-converted lead, bad signature → 401.

---

## Phase 7 — Notifications
- [x] Slack incoming webhook (`slackClient.ts`)
- [x] Email alerts via Nodemailer (separate SMTP transport from Resend)
- [x] Settings + in-app notifications (`notification_settings`, `notifications` tables, read/unread)

`notificationService.ts` is the single place notifications get created, called from the services that own each transition. Slack fires on reply + conversion, email on reply only, follow-ups are in-app only. All external dispatch is fire-and-forget. Verified: no duplicate notifications on repeat transitions, follow-ups don't alert.

---

## Phase 8 — Analytics
- [x] `GET /api/analytics/overview` — open/reply/conversion rates via grouped Postgres counts
- [x] `GET /api/analytics/campaigns` (per-campaign breakdown), `GET /api/analytics/series` (14-bucket trend), both plus overview support `?dateFrom=&dateTo=`

Added `leads.openedAt`/`repliedAt`/`convertedAt`, stamped on first transition — trend series only reflects data from Phase 8 onward. Rate/bucketing math is unit-tested; DB queries verified by manual smoke test.

---

## Phase 9 — Settings & Integrations
- [x] Encrypted API key storage (`api_key_credentials`, AES-256-GCM) — write-only, masked display only
- [x] Sender identity (round-trippable, SMTP password encrypted), profile (`users.name`/`email`)
- [x] Danger zone: disconnect key, `DELETE /api/settings/data` (wipes all app tables except `users`)

Real provider credentials still come from `.env` — this module is just the Settings page's storage/display layer, not wired into the actual API clients yet. Encryption round-trip unit-tested; rest verified by manual smoke test.

---

## Phase 10 — Deployment & Integration
- [ ] Hosting (Railway/Render: API, worker, Redis, Postgres)
- [ ] Swap frontend mock layer for the real API client
- [ ] Logging/error monitoring baseline

---

## Status Legend
- [x] Done
- [~] Skipped / descoped
- [ ] Not started
