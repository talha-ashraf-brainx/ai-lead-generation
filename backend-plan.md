# Backend Build Plan
## AI-Powered Lead Generation and Outreach Automation

Stack: Node.js (Express) + PostgreSQL + BullMQ (Redis). Built phase by phase, module by module, mirroring the frontend modules in `frontend-plan.md`. Check items off as they're completed.

### Development Approach
- **Real integrations, seeded for dev:** unlike the frontend's mock layer, the backend talks to real third-party APIs (Apollo/Hunter, OpenAI, SendGrid, Slack). A seed/mock mode stubs these during development so flows can be iterated on without burning API credits, per SRS Section 5.
- **Managed infra (deploy-time):** Postgres and Redis run locally during development (Homebrew Postgres, local Redis); a managed provider (Supabase/Neon/Railway) takes over before deploy (Phase 10).
- **npm workspaces monorepo:** server lives alongside the existing `frontend/` package so shared types/config stay in sync.

---

## Phase 0 — Backend Foundation
- [x] Monorepo/package setup (npm workspaces, `backend/` package, Express scaffold, core middleware — cors, error handling, logging)
- [x] Postgres provisioning (local, via Homebrew) + ORM/schema setup (TypeORM, not Prisma — see Phase 1 note) + initial migration
- [x] Environment/secrets config (`.env`) + base folder structure (`routes/`, `services/`, `models/`, `jobs/`, `lib/`)

**Implementation notes:** No third-party API calls yet — purely structural/tooling, same role as frontend Phase 0.

---

## Phase 1 — Auth Module
- [x] User model + migration (TypeORM, not Prisma — swapped per user request; entity in `backend/src/entities/User.ts`, migration in `backend/src/migrations/`)
- [x] JWT auth (custom JWT via `jsonwebtoken` + `bcryptjs`, not Passport/Clerk — simpler for a single-user app) — login, session issuing (httpOnly cookie, per NFR-SEC-2), protected-route middleware
- [x] Password reset flow (request + token verification; real email deferred to Notifications module — dev token surfaced in logs/response while `SEED_MODE=true`)

**Implementation notes:** Mirrors frontend Phase 1 — single-user auth, no self-serve signup (per SRS scope).

---

## Phase 2 — Lead Input & Data Model
- [x] Leads schema + migrations (company, contact, email, website, status, campaign FK — `campaignId`/`campaignName` columns added now with no DB-level FK constraint yet, since the Campaign table doesn't exist until Phase 5/6)
- [x] CSV import endpoint (PapaParse, column validation, duplicate detection) — split into `POST /api/leads/csv/preview` and `POST /api/leads/csv/import`
- [x] Keyword/location search endpoint (seed-mode synthetic leads for now — real Apollo/Hunter call lands in Phase 3) + import job status endpoint (`POST /api/leads/search`, `GET /api/leads/import-jobs/:id`)

**Implementation notes:** Backs the frontend's Lead Input Module (Phase 3); this is where the "dental clinics in London" demo flow starts. Search runs as an in-process fire-and-forget job (no queue needed yet — BullMQ lands in Phase 5), polled via the job-status endpoint.

---

## Phase 3 — Lead Enrichment
- [x] Apollo.io / Hunter.io API client integration (`backend/src/lib/apolloClient.ts`, `backend/src/lib/hunterClient.ts` — Apollo People Match primary, Hunter Email Finder/Domain Search fallback, matching the Settings copy's "enrichment fallback" framing)
- [x] Enrichment job (per lead: company, contact name, email, website) + status tracking (pending/enriched/failed) + retry (`backend/src/services/enrichmentService.ts` — in-process retry with backoff per run since BullMQ isn't in yet; `enrichmentAttempts`/`enrichmentError` columns added via migration; manual retry via `POST /api/leads/:id/enrich`)
- [x] Seed/mock mode for enrichment (dev without burning API credits) — 90% simulated success rate, mirrors the frontend mock's `scheduleEnrichment()`

**Implementation notes:** Feeds the enrichment status shown in frontend Phase 4's leads table. Search-sourced leads are created `pending` (unchanged from Phase 2, so email-based dedup still works) and automatically enqueued for enrichment right after save; CSV-imported leads stay `enriched` as before (trusted user data). Real company *discovery* by niche/location (Apollo/Hunter organization search) is still seed-only — only per-lead enrichment talks to live providers now.

---

## Phase 4 — AI Email Generation
- [x] OpenAI SDK integration + prompt template (company/industry/pain-point context) — `backend/src/lib/openaiClient.ts`; uses the `openai` SDK pointed at OpenRouter (`OPENROUTER_API_KEY`/`OPENROUTER_MODEL`, default `openai/gpt-4o-mini`) rather than OpenAI directly, JSON-mode response
- [x] Email generation endpoint (per lead or bulk) + regenerate endpoint — `POST /api/email-drafts/:leadId/generate` (also serves as regenerate, matching the frontend's single `generateEmail()` call site) and `POST /api/email-drafts/bulk-generate`
- [x] Draft storage (subject/body, editable before send) — `email_drafts` table (FK to `leads`, cascade delete); `GET`/`PATCH /api/email-drafts/:leadId` for fetch/edit/approve

**Implementation notes:** Backs frontend Phase 5 (email preview/edit screen). Seed mode reuses the frontend mock's template rotation (`backend/src/lib/emailTemplateGenerator.ts`) so drafts vary without burning OpenAI credits.

---

## Phase 5 — Email Sending & Follow-up Sequencing
- [x] SendGrid API integration (send endpoint, message ID tracking) — `backend/src/lib/sendgridClient.ts`; message ID + per-lead-per-stage tracking in the new `campaign_sends` table
- [x] BullMQ + Redis queue setup for scheduled/deferred sends — `backend/src/jobs/emailQueue.ts` (`Queue`) + `emailWorker.ts` (`Worker`, started in-process from `index.ts`; no separate worker deploy target until Phase 10). Local Redis run via `brew services start redis`.
- [x] Follow-up sequence jobs (day 3 / day 7, conditional on no reply detected) — day3/day7 `campaign_sends` rows are created lazily by the worker after the prior stage sends, delayed via BullMQ; the job checks `lead.status` for `replied`/`converted` before sending and marks `skipped` otherwise. Real delays are 3/7 days; seed mode compresses to 15s/30s (`backend/src/lib/followUpSchedule.ts`) so the sequence is watchable in a dev session.
- [x] SendGrid webhook endpoint (opens/clicks/bounces) — `POST /api/webhooks/sendgrid`, verified via `@sendgrid/eventwebhook` when `SENDGRID_WEBHOOK_VERIFICATION_KEY` is set (skipped with a logged warning in dev); matches events back to a send via a `campaignSendId` custom arg passed at send time (more reliable than matching SendGrid's message id, which gets suffixed between send and webhook delivery)

**Implementation notes:** The largest backend phase — real queueing/scheduling infra backs frontend Phase 6 (Campaigns & Outreach). Also stood up the `campaigns` table (deferred from Phase 2/3) and added the `leads.campaignId → campaigns.id` FK that Phase 2 left off. `POST /api/campaigns` creates the campaign, assigns leads (`campaignId`/`campaignName`), and queues one `initial`-stage send per lead using each lead's approved `email_drafts` row (a lead with no draft or no email fails that row without blocking the others). Verified end-to-end in seed mode: send → simulated open (webhook code path, shared with the real webhook handler) → day3 → day7, and separately confirmed a reply (`lead.status = 'replied'`) correctly skips day3 and halts the sequence before day7 is ever created.

---

## Phase 6 — Lead Tracker & Reply Detection
- [x] Status transition logic (contacted → opened → replied → converted) — `backend/src/lib/leadStatusRank.ts` enforces forward-only ordering for automatic transitions (opened via Phase 5's webhook, replied via this phase's inbound parse); converted has no automated signal (per SRS scope) so it's manual-only, same as any other admin correction
- [x] Reply detection (inbound parse/webhook) + lead/campaign status update endpoints — `POST /api/webhooks/sendgrid-inbound` (SendGrid Inbound Parse) + `PATCH /api/leads/:id/status` and `PATCH /api/campaigns/:id/status`

**Implementation notes:** Backs frontend Phase 7 (Lead Tracker Dashboard); reply detection only, no reply UI (per SRS out-of-scope). Every real send now sets a per-send `replyTo: reply+<campaignSendId>@INBOUND_REPLY_DOMAIN` (`backend/src/lib/inboundReply.ts`) so an inbound reply's `to` field maps back to the exact lead without guessing from sender address — the inbound webhook extracts that id and flips the lead to `replied` (forward-only, never downgrades an already-`converted` lead). SendGrid Inbound Parse has no request signing like the Event Webhook, so the endpoint is instead protected by an `INBOUND_PARSE_SECRET` query-string token (skipped with a logged warning in dev, same pattern as the Phase 5 webhook's signature key). The two `PATCH .../status` endpoints set status directly with no forward-only guard — they're the manual/admin path (e.g. marking a lead "converted" after a call, or a campaign "completed"), distinct from the automatic webhook-driven transitions. Verified end-to-end: reply on a `contacted` lead → `replied`; reply on an already-`converted` lead → stays `converted`; wrong/missing inbound-parse token → 401/warning as expected.

---

## Phase 7 — Notifications Module
- [x] Slack incoming webhook integration — `backend/src/lib/slackClient.ts` (plain `fetch` POST, no SDK needed for an incoming webhook)
- [x] Email alert via Nodemailer — `backend/src/lib/mailer.ts`, distinct SMTP transport from SendGrid (SendGrid is outreach-only; this is for internal "a lead replied" alerts to the account owner)
- [x] Notification settings storage + test/verify endpoint + in-app notification records (mark as read) — `notification_settings` (singleton row, auto-created with defaults) + `notifications` tables; `PUT /api/notifications/settings`, `POST /api/notifications/settings/test-slack` (mirrors the frontend mock's exact validation/copy), `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `DELETE /api/notifications`

**Implementation notes:** Backs frontend Phase 8. `backend/src/services/notificationService.ts` is the single place that creates notifications and fans out alerts — `notifyReply`/`notifyConversion`/`notifyFollowUp`, called from the services that already own each transition rather than adding notification logic to routes: `campaignSendTrackingService.recordReply` (Phase 6, only fires on an actual forward transition — no duplicate notification if a lead replies twice), `leadStatusService.setLeadStatus` (only on a genuine `→ converted` change, not a no-op re-save), and `emailWorker.processSend` (day3/day7 sends). Slack fires for reply + conversion; email fires for reply only, matching the frontend's own settings copy ("Get an email when a lead replies"); follow-up sends are in-app-only by design — alerting on every routine automated send would spam both channels every 3/7 days per lead. External dispatch is fire-and-forget and never throws back into the triggering flow (a Slack/SMTP failure can't break reply detection or a send). Verified end-to-end in seed mode: reply → notification + logged (not sent) Slack/email; idempotent re-conversion → no duplicate notification; day3 follow-up → in-app notification only, no alert dispatch logged.

---

## Phase 8 — Analytics Module
- [x] Aggregation queries (open rate, reply rate, conversion rate) — `GET /api/analytics/overview`, backed by `backend/src/services/analyticsService.ts` (Postgres `COUNT(*) FILTER (WHERE ...)` grouped by `leads.status`) and the pure `computeRates` helper in `backend/src/lib/analyticsMath.ts`
- [x] Per-campaign breakdown + date range filtering endpoints — `GET /api/analytics/campaigns` (one row per campaign, including zero-lead campaigns) and `GET /api/analytics/series` (14-bucket trend, same bucketing algorithm as the frontend mock); all three endpoints accept `?dateFrom=&dateTo=` filtering on `leads.createdAt`

**Implementation notes:** Backs frontend Phase 9. The trend series needed real event timestamps that didn't exist yet — added `leads.openedAt`/`repliedAt`/`convertedAt` (migration `AddLeadStatusTimestamps`), stamped the first time a lead reaches that status in both `campaignSendTrackingService.advanceLeadStatus` (automatic opened/replied transitions) and `leadStatusService.setLeadStatus` (manual override, including `converted`). These columns are net-new, so leads that reached a status *before* this phase shipped have no historical timestamp — the series only reflects events going forward, a known limitation of adding instrumentation after the fact. Overview/breakdown counts always use the current `leads.status` column, unaffected by this gap. `computeRates`/`bucketSeries` are pure and unit-tested (`backend/src/lib/analyticsMath.test.ts`); the DB-facing aggregation queries are the untestable-without-Postgres part, verified via manual smoke test (login → `GET /api/analytics/overview|series|campaigns` against seed-mode dev data, plus an invalid `dateFrom` returning 400).

---

## Phase 9 — Settings & Integrations
- [x] API key storage, encrypted at rest (Apollo/Hunter, OpenAI, SendGrid) — `api_key_credentials` table (one row per provider), AES-256-GCM via `backend/src/lib/encryption.ts` (`SETTINGS_ENCRYPTION_KEY`); `GET/PUT/DELETE /api/settings/api-keys[/:provider]`. Matches the frontend mock's contract exactly — the raw value is never returned, only a masked last-4 + `connected`/`updatedAt`.
- [x] Sender identity config + danger zone endpoints (disconnect integration, delete data) — `GET/PUT /api/settings/sender-identity` (singleton row, auto-created with defaults, same pattern as `NotificationSettings`; `smtpPassword` is encrypted at rest but *decrypted* on read, unlike API keys, since the frontend form is round-trippable, not write-only), `GET/PUT /api/settings/profile` (maps directly onto the existing `users.name`/`email`, scoped to `req.user.id`), `DELETE /api/settings/api-keys/:provider` (disconnect), `DELETE /api/settings/data` (delete-everything, mirrors the frontend mock's `deleteAllData` — wipes `campaign_sends`/`email_drafts`/`notifications`/`leads`/`campaigns`/`lead_import_jobs`/`api_key_credentials`/`notification_settings`/`sender_identity` in FK-safe order inside one transaction, leaves `users` untouched)

**Implementation notes:** Backs frontend Phase 10. Real provider credentials (Apollo/Hunter/OpenRouter/SendGrid/SMTP) still come from `.env` per `dev-required.md` — this module is the Settings page's storage/display layer (connected/disconnected status, masked value), deliberately *not* wired into `apolloClient`/`hunterClient`/`openaiClient`/`sendgridClient`, which would be a materially larger change (swap every client from a static env read to a live DB lookup) outside this phase's scope. `encryptSecret`/`decryptSecret` round-trip is pure and unit-tested (`backend/src/lib/encryption.test.ts`); verified end-to-end in seed mode: save/list/disconnect each API key provider, save/reload sender identity (confirmed the SMTP password comes back decrypted in the response but stored as ciphertext in Postgres via `psql`), save/reload profile, invalid provider → 400.

---

## Phase 10 — Deployment & Integration
- [ ] Hosting setup (Railway/Render: API, worker, Redis, Postgres)
- [ ] Frontend-backend integration (swap `frontend/src/lib/mock/` for a real API client)
- [ ] Logging/error monitoring baseline

**Implementation notes:** Cross-cutting — done last once backend modules are stable, same role as frontend Phase 11.

---

## Status Legend
- [x] Done
- [~] Skipped / descoped (reason noted inline)
- [ ] Not started / in progress
