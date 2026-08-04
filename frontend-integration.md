# Frontend Integration Guide

The API contract for swapping the frontend's mock layer (`frontend/src/lib/mock/*`, all localStorage-backed) over to the real backend (`backend/`, Phases 0–7 done — see `backend-build.md`). This document describes the contract; rewriting each mock call site to use it is separate, not-yet-started work.

## 1. One swappable base URL

Every request must go through a single constant so switching dev → staging → prod is a one-line env var change, never a find-and-replace across components.

```ts
// frontend/src/lib/api/client.ts (recommended — doesn't exist yet)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // required — auth is an httpOnly cookie, not a bearer token
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error?.message ?? response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
```

No component, page, or `lib/mock/*` replacement should call `fetch` directly or embed a URL — always through this one function. Set `VITE_API_BASE_URL` per environment (`frontend/.env.local` for dev, build-time env for staging/prod).

## 2. Auth model

Login sets an httpOnly cookie (`emberline_session`, see `AUTH_COOKIE_NAME`) — there is no bearer token to store in JS. Every request needs `credentials: "include"` (already in the snippet above). The backend's `CORS_ORIGIN` env var must exactly match the frontend's origin for cookies to be accepted cross-origin.

| | |
|---|---|
| `POST /api/auth/login` | `{ email, password }` → `{ user: { id, email, name }, token }`. Sets the session cookie. `token` is also returned in the body but the cookie is what auth actually relies on. |
| `POST /api/auth/logout` | No body → `204`. Clears the cookie. |
| `GET /api/auth/me` | Auth required → `{ user }`. Use on app load to check session validity. |
| `POST /api/auth/password-reset/request` | `{ email }` → `{ message, ...devFields }`. In `SEED_MODE=true`, the reset token is included in the response/logs instead of emailed — fine for dev, don't rely on that shape once seed mode is off. |
| `POST /api/auth/password-reset/confirm` | `{ token, newPassword }` (min 8 chars) → `204`. |

No self-serve signup exists (single account-owner app, per SRS).

## 3. Response conventions

- Success: the resource (or array) directly as JSON — no `{data: ...}` envelope.
- Error: `{ "error": { "message": string } }` with a matching 4xx/5xx status. Check `error.message`, not the shape.
- `204 No Content` for actions with nothing to return (logout, mark-read-all, clear).
- Auth failures: `401`. Not found: `404`. Validation: `400`.

## 4. Leads

| | |
|---|---|
| `POST /api/leads/csv/preview` | `multipart/form-data`, field `file` (a `.csv`) → `{ headers, missingColumns, rows: [{rowNumber, company, contactName, email, website, isValid, issues}] }` |
| `POST /api/leads/csv/import` | `{ rows: CsvPreviewRow[] }` (the *edited* rows from the preview step) → `{ importedCount, duplicateCount, errorCount, errorDetails: [{row, reason}] }` |
| `POST /api/leads/search` | `{ niche, location }` → `202 { jobId, status: "processing" }`. Fire-and-forget; poll the job. |
| `GET /api/leads/import-jobs/:id` | → `{ id, niche, location, status: "processing"\|"completed"\|"failed", importedCount, duplicateCount, errorCount, errorMessage, createdAt, completedAt }` |
| `POST /api/leads/:id/enrich` | Manual (re-)enrichment → the updated `Lead` |
| `PATCH /api/leads/:id/status` | `{ status: "contacted"\|"opened"\|"replied"\|"converted" }` → the updated `Lead`. Manual/admin-only — `"converted"` has no automated trigger, this is the only way to set it. |

**Lead shape returned everywhere:** `{ id, company, contactName, email, website, industry, status, enrichment, enrichmentAttempts, enrichmentError, campaignId, campaignName, painPoint, source, createdAt }` — a superset of the frontend's `Lead` type (extra fields `enrichmentAttempts`/`enrichmentError` are safe to ignore).

### ⚠️ Not built — blocks LeadsPage/TrackerPage integration

There is **no `GET /api/leads` list endpoint** (pagination/search/status/industry/campaign/date filters — everything `fetchLeads(params)` does in the mock) and **no `GET /api/leads/:id`** single-fetch. Every page that lists or looks up a lead by id (`LeadsPage`, `TrackerPage`, `LeadDetailDrawer`, `LeadActivityDrawer`, `EmailReviewPage`'s lead-context panel) is blocked on this. Also missing: `DELETE /api/leads/:id` (bulk delete), and a dedicated bulk-add-to-campaign endpoint (campaign creation *does* assign leads — see §6 — but there's no standalone "add these leads to an existing campaign" call). Flag this before scheduling frontend integration work — it needs to be built first.

## 5. Email drafts

| | |
|---|---|
| `GET /api/email-drafts/:leadId` | → the `EmailDraft`, or `404` if none generated yet |
| `POST /api/email-drafts/:leadId/generate` | No body. Generates **or regenerates** — there's one endpoint for both (matches the frontend's own `generateEmail()` being called for both cases). Always resets `status` to `"draft"`. |
| `PATCH /api/email-drafts/:leadId` | `{ subject, body, status: "edited"\|"approved" }` → updated `EmailDraft`. `404` if no draft exists yet — generate first. |
| `POST /api/email-drafts/bulk-generate` | `{ leadIds: string[] }` → `202 { count }`. Fire-and-forget, staggered; failures don't surface here — check each lead's draft individually. |

**EmailDraft shape:** `{ id, leadId, subject, body, status, personalization: [{label, value}], generatedAt, editedAt }` — matches the frontend's `EmailDraft` type exactly (plus an `id`).

## 6. Campaigns

| | |
|---|---|
| `GET /api/campaigns` | → `Campaign[]`, newest first |
| `POST /api/campaigns` | See body shape below → `201 Campaign`. Assigns every lead's `campaignId`/`campaignName`, snapshots each lead's **approved** draft into an initial send, and starts sending immediately (or at `scheduledAt` if `schedule: "scheduled"`). |
| `GET /api/campaigns/:id` | → `Campaign` |
| `GET /api/campaigns/:id/leads` | → `Lead[]` currently assigned to this campaign |
| `PATCH /api/campaigns/:id/status` | `{ status: "draft"\|"sending"\|"active"\|"completed" }` → updated `Campaign`. Manual override (e.g. marking "completed"). |

**`POST /api/campaigns` body:**
```json
{
  "name": "string",
  "leadIds": ["uuid", "..."],
  "schedule": "immediate | scheduled",
  "scheduledAt": "ISO string or null",
  "followUps": {
    "day3": { "enabled": true, "subject": "string", "body": "string (supports {{firstName}}/{{company}})" },
    "day7": { "enabled": true, "subject": "string", "body": "string" }
  }
}
```

**Campaign shape returned — differs from the frontend type:** `{ id, name, status, schedule, scheduledAt, followUpDay3Enabled, followUpDay3Subject, followUpDay3Body, followUpDay7Enabled, followUpDay7Subject, followUpDay7Body, createdAt, sentAt }`. Two real differences from the frontend's `Campaign` type:
- **No `leadIds` array on the response.** Membership is derived from `leads.campaignId`, not stored on the campaign. Call `GET /api/campaigns/:id/leads` for the member list (or ids: `.map(l => l.id)`).
- **Follow-ups are flattened**, not nested under a `followUps: { day3, day7 }` object. An adapter function is the cleanest fix on the frontend side rather than changing every read site.

A lead with no email or no *approved* draft still gets a `campaign_sends` row (status `"failed"`, with a reason) rather than blocking the rest of the campaign — if a campaign looks "stuck," check `GET /api/campaigns/:id/leads` against each lead's draft status before assuming a bug.

## 7. Notifications

| | |
|---|---|
| `GET /api/notifications` | → `AppNotification[]`, newest first |
| `POST /api/notifications/:id/read` | → updated `AppNotification` |
| `POST /api/notifications/read-all` | → `204` |
| `DELETE /api/notifications` | Clears all → `204` |
| `GET /api/notifications/settings` | → `NotificationSettings` (auto-created with defaults on first call) |
| `PUT /api/notifications/settings` | `{ slackEnabled, slackWebhookUrl, emailAlertsEnabled }` → updated `NotificationSettings` |
| `POST /api/notifications/settings/test-slack` | `{ webhookUrl }` → `{ success, message }` — same validation/copy as the current mock's `testSlackWebhook`, so this one's a drop-in swap |

**AppNotification shape:** `{ id, kind: "reply"|"follow_up"|"conversion", title, detail, leadId, campaignId, read, createdAt }` — matches the frontend type exactly (plus `id`).

There is no `GET /api/notifications/subscribe`-style push — the frontend mock's `subscribeToNotifications` (a same-tab event emitter over localStorage writes) has no server equivalent. Polling `GET /api/notifications` on an interval, or after actions likely to generate one, is the integration path until/unless a websocket or SSE channel gets added.

## 8. Not built yet (don't integrate against these)

- **Lead list/filter/single-fetch/delete** — see the callout in §4. This is the single biggest blocker for integration; most lead-touching pages need it.
- **Lead discovery by niche/location is seed-mode only** — `POST /api/leads/search` throws if `SEED_MODE=false`. Only per-lead *enrichment* talks to real Apollo/Hunter; the search/discovery call itself doesn't yet.
- **Settings' stored API keys aren't live** — `PUT /api/settings/api-keys/:provider` stores the key (encrypted) and shows it as connected, but the actual Apollo/Hunter/OpenRouter/SendGrid clients still read from `.env`, not from what's saved here. Don't expect saving a key in Settings to change enrichment/generation/sending behavior.

## 9. Analytics

| | |
|---|---|
| `GET /api/analytics/overview?dateFrom=&dateTo=` | → `{ total, openRate, replyRate, conversionRate }`. Both query params optional, ISO date strings, filtered on `leads.createdAt`. |
| `GET /api/analytics/series?dateFrom=&dateTo=` | → `{ opened, replied, converted }`, each a 14-point `{ date, value }[]` trend bucketed across the filtered range's span. Empty arrays if no lead in range has reached that status yet. |
| `GET /api/analytics/campaigns?dateFrom=&dateTo=` | → `CampaignBreakdownRow[]` — one row per campaign (`{ campaignId, campaignName, total, openRate, replyRate, conversionRate }`), including campaigns with zero leads in range. |

Shapes match the frontend's `AnalyticsOverview`/`AnalyticsSeries`/`CampaignBreakdownRow` types in `frontend/src/types/analytics.ts` exactly — `fetchAnalyticsOverview`/`fetchAnalyticsSeries`/`fetchCampaignBreakdown` in the mock are a drop-in swap once pointed at these URLs (query params via `?dateFrom=...&dateTo=...` instead of a body object).

⚠️ The series only reflects lead status changes that happened after this endpoint shipped (see `backend-build.md`'s Known gaps) — a lead that was already `replied` beforehand won't show up in the `replied` trend, only in the overview/breakdown rates.

## 10. Settings & integrations

| | |
|---|---|
| `GET /api/settings/api-keys` | → `ApiKeyStatus[]`, one per provider (`apollo`\|`hunter`\|`openai`\|`sendgrid`), always all four regardless of connection state |
| `PUT /api/settings/api-keys/:provider` | `{ value: string }` → updated `ApiKeyStatus`. Upsert — creates or replaces. The raw value is never echoed back, only a masked last-4. |
| `DELETE /api/settings/api-keys/:provider` | Disconnect → `204` |
| `GET /api/settings/sender-identity` | → `SenderIdentity` (singleton, auto-created with defaults on first call) |
| `PUT /api/settings/sender-identity` | Full `SenderIdentity` body → updated `SenderIdentity`. Unlike API keys, `smtpPassword` **is** returned in plaintext — this field is meant to be round-tripped back into the form, not write-only. |
| `GET /api/settings/profile` | → `ProfileSettings` for the authenticated user (`{ name, email }`) |
| `PUT /api/settings/profile` | `{ name, email }` → updated `ProfileSettings` |
| `DELETE /api/settings/data` | Danger zone "delete everything" → `204`. Wipes every lead, campaign, email draft, notification, and setting; **does not** delete the user account or log you out. |

Shapes match `frontend/src/types/settings.ts` exactly, so `frontend/src/lib/mock/settings.ts`'s functions are a drop-in swap. `:provider` must be one of the four values above or the request 400s.

## 11. Seed mode and integration testing

The backend's `SEED_MODE=true` (default) fakes every external provider call but the *HTTP contract is identical* — same endpoints, same request/response shapes, same status codes. Integrate against seed mode first; flipping to real providers later (per `dev-required.md`) shouldn't require any frontend changes. Two behavioral things worth knowing while integration-testing:
- Follow-up sends fire after 15s/30s in seed mode instead of 3/7 days — a campaign's `campaign_sends` rows will visibly progress within a dev session.
- A simulated "open" event fires ~70% of the time a few seconds after a seed-mode send, through the same code path a real SendGrid webhook would hit — so `Lead.status` transitions to `"opened"` are observable without a real webhook.
