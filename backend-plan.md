# Backend Build Plan
## AI-Powered Lead Generation and Outreach Automation

Stack: Node.js (Express) + PostgreSQL + BullMQ (Redis). Built phase by phase, module by module, mirroring the frontend modules in `frontend-plan.md`. Check items off as they're completed.

### Development Approach
- **Real integrations, seeded for dev:** unlike the frontend's mock layer, the backend talks to real third-party APIs (Apollo/Hunter, OpenAI, SendGrid, Slack). A seed/mock mode stubs these during development so flows can be iterated on without burning API credits, per SRS Section 5.
- **Managed infra:** Postgres and Redis are provisioned via a managed provider (Supabase/Neon/Railway) to skip DB/ops setup.
- **npm workspaces monorepo:** server lives alongside the existing `frontend/` package so shared types/config stay in sync.

---

## Phase 0 — Backend Foundation
- [ ] Monorepo/package setup (npm workspaces, `server/` package, Express scaffold, core middleware — cors, error handling, logging)
- [ ] Managed Postgres provisioning + ORM/schema setup (Prisma) + initial migration
- [ ] Environment/secrets config (`.env`) + base folder structure (`routes/`, `services/`, `models/`, `jobs/`, `lib/`)

**Implementation notes:** No third-party API calls yet — purely structural/tooling, same role as frontend Phase 0.

---

## Phase 1 — Auth Module
- [ ] User model + migration
- [ ] JWT auth (Passport.js or Clerk) — login, session issuing, protected-route middleware
- [ ] Password reset flow (request + token verification; real email deferred to Notifications module)

**Implementation notes:** Mirrors frontend Phase 1 — single-user auth, no self-serve signup (per SRS scope).

---

## Phase 2 — Lead Input & Data Model
- [ ] Leads schema + migrations (company, contact, email, website, status, campaign FK)
- [ ] CSV import endpoint (PapaParse, column validation, duplicate detection)
- [ ] Keyword/location search endpoint (queries Apollo/Hunter for matching leads) + import job status endpoint

**Implementation notes:** Backs the frontend's Lead Input Module (Phase 3); this is where the "dental clinics in London" demo flow starts.

---

## Phase 3 — Lead Enrichment
- [ ] Apollo.io / Hunter.io API client integration
- [ ] Enrichment job (per lead: company, contact name, email, website) + status tracking (pending/enriched/failed) + retry
- [ ] Seed/mock mode for enrichment (dev without burning API credits)

**Implementation notes:** Feeds the enrichment status shown in frontend Phase 4's leads table.

---

## Phase 4 — AI Email Generation
- [ ] OpenAI SDK integration + prompt template (company/industry/pain-point context)
- [ ] Email generation endpoint (per lead or bulk) + regenerate endpoint
- [ ] Draft storage (subject/body, editable before send)

**Implementation notes:** Backs frontend Phase 5 (email preview/edit screen).

---

## Phase 5 — Email Sending & Follow-up Sequencing
- [ ] SendGrid API integration (send endpoint, message ID tracking)
- [ ] BullMQ + Redis queue setup for scheduled/deferred sends
- [ ] Follow-up sequence jobs (day 3 / day 7, conditional on no reply detected)
- [ ] SendGrid webhook endpoint (opens/clicks/bounces)

**Implementation notes:** The largest backend phase — real queueing/scheduling infra backs frontend Phase 6 (Campaigns & Outreach).

---

## Phase 6 — Lead Tracker & Reply Detection
- [ ] Status transition logic (contacted → opened → replied → converted)
- [ ] Reply detection (inbound parse/webhook) + lead/campaign status update endpoints

**Implementation notes:** Backs frontend Phase 7 (Lead Tracker Dashboard); reply detection only, no reply UI (per SRS out-of-scope).

---

## Phase 7 — Notifications Module
- [ ] Slack incoming webhook integration
- [ ] Email alert via Nodemailer
- [ ] Notification settings storage + test/verify endpoint + in-app notification records (mark as read)

**Implementation notes:** Backs frontend Phase 8.

---

## Phase 8 — Analytics Module
- [ ] Aggregation queries (open rate, reply rate, conversion rate)
- [ ] Per-campaign breakdown + date range filtering endpoints

**Implementation notes:** Backs frontend Phase 9.

---

## Phase 9 — Settings & Integrations
- [ ] API key storage, encrypted at rest (Apollo/Hunter, OpenAI, SendGrid)
- [ ] Sender identity config + danger zone endpoints (disconnect integration, delete data)

**Implementation notes:** Backs frontend Phase 10.

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
