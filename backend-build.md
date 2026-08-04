# Backend Build Report

Status snapshot of the Emberline backend (`backend/`) — what exists, how the pieces fit together, and how to run it. For the phase-by-phase checklist and rationale behind each decision, see `backend-plan.md`; this doc is the "how it works" companion. For the API contract to integrate the frontend against, see `frontend-integration.md`.

## Stack

Node.js + Express + TypeScript, TypeORM/Postgres, BullMQ/Redis. npm workspace (`frontend`, `backend`) at the repo root — `npm run dev:backend` / `build:backend`.

## Status: Phases 0–9 done (of 10)

Auth → Leads (CSV/search) → Enrichment → AI email drafts → Campaign sending & follow-ups → Reply detection → Notifications → Analytics → Settings/API-key storage. Remaining: Deployment/frontend-integration (10) — see `backend-plan.md`.

## Data model

| Table | Purpose |
|---|---|
| `users` | Single account-owner (no self-serve signup) |
| `leads` | Company/contact/email/website/industry, `status` (contacted→opened→replied→converted), `enrichment` (pending/enriched/failed), denormalized `campaignId`/`campaignName` |
| `lead_import_jobs` | Progress tracking for async keyword/location search |
| `email_drafts` | One AI-generated draft per lead (subject/body/status/personalization), FK→leads cascade |
| `campaigns` | Name, status (draft/sending/active/completed), schedule, follow-up day3/day7 subject+body+enabled |
| `campaign_sends` | One row per lead per stage (initial/day3/day7) — status, SendGrid message id, timestamps for sent/opened/clicked/bounced |
| `notification_settings` | Singleton row (Slack webhook + enabled, email-alerts toggle), auto-created with defaults |
| `notifications` | In-app feed — kind (reply/follow_up/conversion), title/detail, read flag |
| `api_key_credentials` | One row per provider (apollo/hunter/openai/sendgrid) — encrypted value + masked display value |
| `sender_identity` | Singleton row — from name/email, optional SMTP fallback (password encrypted), auto-created with defaults |

`leads.campaignId → campaigns.id` and both `campaign_sends` FKs are real DB constraints. Notification FKs to leads/campaigns are `SET NULL` (a notification outlives its source record). `leads.openedAt`/`repliedAt`/`convertedAt` (added Phase 8) are set once, the first time a lead reaches that status — they feed the Analytics trend series and are otherwise unused by the rest of the app, which still reads `leads.status` directly.

## Request flow (per module)

**Auth** — JWT in an httpOnly cookie, `bcryptjs` hashing, password-reset tokens stored as SHA-256 hashes. `requireAuth` middleware gates everything except `/health` and the two webhook routes.

**Leads** — CSV import (PapaParse, dedup by lowercased email) and keyword/location search (seed-mode synthetic leads today — real Apollo/Hunter *discovery* isn't built; see caveat below) both land in `leads` with `enrichment: pending`. Every search-sourced lead is then handed to the enrichment pipeline automatically.

**Enrichment** — Apollo (primary) → Hunter (fallback) fill in contact/email/website for a lead. Up to 3 in-process attempts with backoff per run; `enrichmentAttempts`/`enrichmentError` track history. Manual retry: `POST /api/leads/:id/enrich`.

**Email drafts** — OpenRouter (OpenAI-compatible `openai` SDK, JSON-mode) generates subject/body from company/industry/pain-point/contact. `POST /api/email-drafts/:leadId/generate` both creates and regenerates (delete-then-insert, so `status` always resets to `draft`). `PATCH` saves user edits as `edited`/`approved`.

**Campaigns & sending** — `POST /api/campaigns` snapshots each selected lead's *approved* draft into an `initial`-stage `campaign_sends` row and enqueues a BullMQ job (delayed if scheduled). A BullMQ `Worker`, started in-process from `index.ts` (no separate worker deploy yet), does the actual SendGrid send, then:
- on success, schedules `day3` (and later `day7`) by creating that stage's row *lazily* — only once the prior stage has actually sent, so the row for a not-yet-due stage never exists to look "queued" prematurely
- before sending a follow-up, checks the lead's live status and marks itself `skipped` if the lead has replied/converted — this is the "conditional on no reply" logic, and it's why reply detection matters even though it's a separate phase
- real delays are 3/7 days; **seed mode compresses these to 15s/30s** so the whole sequence is watchable in one dev session

**Reply detection** — every real send sets `replyTo: reply+<campaignSendId>@INBOUND_REPLY_DOMAIN`. SendGrid's Inbound Parse webhook (`POST /api/webhooks/sendgrid-inbound`) reads that address back out of the `to` field and flips the lead to `replied`. No request signing exists for Inbound Parse, so this route is instead gated by a `?token=` query param matched against `INBOUND_PARSE_SECRET` (optional in dev, logs a warning if unset).

**Open/click/bounce tracking** — the *other* webhook, `POST /api/webhooks/sendgrid` (SendGrid's Event Webhook), is ECDSA-signature-verified via `@sendgrid/eventwebhook` when `SENDGRID_WEBHOOK_VERIFICATION_KEY` is set. Events carry a `campaignSendId` custom-arg (set at send time) rather than relying on SendGrid's message id, which gets suffixed between send and webhook delivery.

**Status transitions** — `opened` and `replied` are automatic and forward-only (`leadStatusRank.ts`'s rank check means a late "open" webhook can never downgrade an already-`replied` lead). `converted` has no automated signal (by design — that's a human call), so it's set via `PATCH /api/leads/:id/status`, and likewise `PATCH /api/campaigns/:id/status` for manual campaign-status correction.

**Notifications** — `notificationService.ts` is the single place notifications get created; it's called from the service that owns each transition (`campaignSendTrackingService.recordReply`, `leadStatusService.setLeadStatus`, `emailWorker.processSend`) rather than living in routes. Reply and conversion trigger both an in-app row and (if enabled in settings) a Slack webhook post and/or a Nodemailer alert email to the account owner — email is reply-only, matching the frontend's own settings copy. Follow-up sends are in-app-only; alerting Slack/email every 3–7 days per lead would be noise. All external dispatch is fire-and-forget — a Slack/SMTP failure never breaks the flow that triggered it.

**Analytics** — `analyticsService.ts` computes open/reply/conversion rates from `leads.status` via grouped Postgres `COUNT(*) FILTER (WHERE ...)` queries (`GET /api/analytics/overview`, `/campaigns`), and a 14-bucket trend series (`GET /api/analytics/series`) from the `openedAt`/`repliedAt`/`convertedAt` timestamps `campaignSendTrackingService`/`leadStatusService` stamp on first transition. All three accept `?dateFrom=&dateTo=`, filtering on `leads.createdAt`. The rate math and bucketing (`lib/analyticsMath.ts`) are pure and mirror the frontend mock's algorithm exactly.

**Settings** — `settingsService.ts` backs the four Settings page sections. API keys (`api_key_credentials`, one row per provider) are encrypted at rest with AES-256-GCM (`lib/encryption.ts`, key from `SETTINGS_ENCRYPTION_KEY`) and never returned in plaintext — only a masked last-4 and connected/disconnected status, matching the frontend's write-only key contract. Sender identity (`sender_identity`, singleton, auto-created with defaults like `NotificationSettings`) also encrypts its SMTP password at rest, but *decrypts* it on read — that field is round-trippable in the frontend form, not write-only, unlike the API keys. Profile reads/writes go straight to the authenticated user's `name`/`email` columns on `users` — no new table. The danger zone's "delete everything" (`DELETE /api/settings/data`) wipes every app table except `users` in one transaction, ordered so child rows (campaign sends, drafts, notifications) are deleted before the leads/campaigns they reference. Real provider credentials (Apollo/Hunter/OpenRouter/SendGrid/SMTP) are unaffected by any of this — they still come from `.env` per `dev-required.md`; this module is purely the Settings page's storage/display layer.

## Seed mode

`SEED_MODE=true` (default) is what makes the whole pipeline demoable without any real API keys or waiting on real network events:

- lead search → synthetic companies instead of a real Apollo/Hunter discovery call
- enrichment → 90% simulated success instead of real Apollo/Hunter lookups
- email drafts → a small set of rotating templates instead of a real LLM call
- sending → simulated success + a probabilistic simulated "open" (same code path the real SendGrid webhook would hit) instead of a real SendGrid send
- follow-up delays shrink from days to seconds
- Slack/email alerts are logged, not actually sent

Flip `SEED_MODE=false` once real credentials are in `.env` (see `dev-required.md` for the manual setup — SendGrid sender verification, Inbound Parse DNS/MX, Event Webhook signing key — that only matters outside seed mode).

## Known gaps

- Lead *discovery* by niche/keyword still only works in seed mode — Phase 3 wired real providers into per-lead *enrichment*, not into the search/discovery call itself (that would be a materially larger feature: Apollo/Hunter organization search by industry+location). `startLeadSearch` throws if `SEED_MODE=false`.
- There's no `GET /api/leads` list/filter/paginate endpoint, and no `GET /api/leads/:id` or `DELETE /api/leads/:id`. Every write path exists (CSV import, search, enrich, status update); the read/list/delete side doesn't yet. This is the main blocker for frontend integration — see `frontend-integration.md` §4/§8.
- The Analytics trend series (`openedAt`/`repliedAt`/`convertedAt`) only has data for status transitions that happened *after* Phase 8 shipped — leads that were already `opened`/`replied`/`converted` before these columns existed have no historical timestamp, so they show up in the overview/breakdown rates but not in the series.
- Settings' stored API keys (`api_key_credentials`) aren't wired into `apolloClient`/`hunterClient`/`openaiClient`/`sendgridClient` — those still read from `.env` (`APOLLO_API_KEY` etc., per `dev-required.md`). The Settings page is a connected/disconnected status display today, not an alternate credential source.

## Testing

`npm run test --workspace=backend` (vitest). Coverage is intentionally narrow: pure-logic modules with no DB/network/queue dependency — `leadStatusRank.ts`, `textUtils.ts` (template rendering), `inboundReply.ts` (reply-address parsing), `csv.ts`, `analyticsMath.ts` (rate/bucketing math), `encryption.ts` (encrypt/decrypt round-trip). Everything that touches Postgres/Redis/external APIs is verified with the manual smoke tests recorded per phase in `backend-plan.md` instead.

## Running locally

```
brew services start postgresql@16   # if not already running
brew services start redis
npm run dev:backend                 # from repo root; runs Express + the BullMQ worker in one process
```

Migrations: `npm run db:migrate --workspace=backend`. Seed the account-owner user: `npm run db:seed --workspace=backend`. Env vars are documented inline in `backend/.env.example`.
