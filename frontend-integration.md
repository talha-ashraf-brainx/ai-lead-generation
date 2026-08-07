# Frontend Integration Guide

The API contract for the frontend's real backend integration (`backend/`, Phases 0–7 done — see `working.md`). The mock layer (`frontend/src/lib/mock/*`, all localStorage-backed) has been fully replaced by `frontend/src/lib/api/*`, which implements everything below.

## 1. One swappable base URL

Every request must go through a single constant so switching dev → staging → prod is a one-line env var change, never a find-and-replace across components.

```ts
// frontend/src/lib/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData; // multer wants the browser's own boundary header, not ours
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // required — auth is an httpOnly cookie, not a bearer token
    ...init,
    headers: isFormData ? init.headers : { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error?.message ?? response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
```

No component or page should call `fetch` directly or embed a URL — always through this one function (`frontend/src/lib/api/*`). Set `VITE_API_BASE_URL` per environment (`frontend/.env.local` for dev — already pointed at this repo's backend port, `4001`; build-time env for staging/prod).

## 2. Auth model

Login sets an httpOnly cookie (`emberline_session`, see `AUTH_COOKIE_NAME`) — there is no bearer token to store in JS. Every request needs `credentials: "include"` (already in the snippet above). The backend's `CORS_ORIGIN` env var must exactly match the frontend's origin for cookies to be accepted cross-origin.

| | |
|---|---|
| `POST /api/auth/signup` | `{ name, email, password }` → `201 { user, token }`. Sets the session cookie, so the client is logged in immediately — no email verification step exists. `409` if the email is taken, `400` if the name is blank, the email fails `isValidEmail`, or the password is under 8 chars. **Each signup creates an isolated tenant** — the new account starts with zero leads/campaigns/settings and can never see another account's data (see §12). |
| `POST /api/auth/login` | `{ email, password }` → `{ user: { id, email, name }, token }`. Sets the session cookie. `token` is also returned in the body but the cookie is what auth actually relies on. |
| `POST /api/auth/logout` | No body → `204`. Clears the cookie. |
| `GET /api/auth/me` | Auth required → `{ user }`. Use on app load to check session validity. |
| `POST /api/auth/password-reset/request` | `{ email }` → `{ message, ...devFields }`. In `DEBUG=true`, the reset token is included in the response (and always logged) instead of relying solely on the real email — don't rely on that shape with `DEBUG=false`. |
| `POST /api/auth/password-reset/confirm` | `{ token, newPassword }` (min 8 chars) → `204`. |

Self-serve signup exists as of the multi-tenancy change — this is no longer a single-account-owner app (it supersedes that part of the SRS). `npm run db:seed` still works for creating the original owner but is no longer the only way in.

## 3. Response conventions

- Success: the resource (or array) directly as JSON — no `{data: ...}` envelope.
- Error: `{ "error": { "message": string } }` with a matching 4xx/5xx status. Check `error.message`, not the shape.
- `204 No Content` for actions with nothing to return (logout, mark-read-all, clear).
- Auth failures: `401`. Not found: `404`. Validation: `400`.

## 4. Leads

| | |
|---|---|
| `GET /api/leads` | Query params `page, pageSize, search, status, industry, campaignId, createdAfter, createdBefore` (all optional except `page`/`pageSize`, which default to `1`/`20`) → `{ rows: Lead[], total: number }`. `status`/`industry` accept `"all"`; `campaignId` accepts `"all"`, `"none"`, or a campaign id. Mirrors the mock's `fetchLeads(params)` contract exactly. |
| `GET /api/leads/:id` | → the `Lead`, or `404` if not found |
| `GET /api/leads/industries` | → `string[]`, distinct industries across all leads, sorted |
| `POST /api/leads/bulk-delete` | `{ ids: string[] }` → `204` |
| `POST /api/leads/bulk-add-to-campaign` | `{ ids: string[], campaignId: string }` → the updated `Lead[]`. Reassigns `campaignId`/`campaignName`, then — per lead, if it doesn't already have an initial `campaign_sends` row for this campaign — queues one immediately via the same eligibility check `POST /api/campaigns` uses at creation (has an email → has a draft → `queued`; missing either → `failed` with a reason). `404` if the campaign doesn't exist. |
| `POST /api/leads/csv/preview` | `multipart/form-data`, field `file` (a `.csv`) → `{ headers, missingColumns, rows: [{rowNumber, company, contactName, email, website, isValid, issues}] }` |
| `POST /api/leads/csv/import` | `{ rows: CsvPreviewRow[] }` (the *edited* rows from the preview step) → `{ importedCount, duplicateCount, errorCount, errorDetails: [{row, reason}] }` |
| `POST /api/leads/search` | `{ niche, location }` → `202 { jobId, status: "processing" }`. Fire-and-forget; poll the job. Always calls Apollo People Search (`q_organization_keyword_tags`/`organization_locations`, see `apolloClient.ts`'s `searchPeopleWithApollo`) — results come back with `email: null` (Apollo doesn't reveal an email in search results) and get their email filled in later by the per-lead enrichment step, same as CSV-imported leads. Returns 5 results in `DEBUG=true`, 25 otherwise. Throws (job lands `"failed"`) if `APOLLO_API_KEY` isn't set. |
| `GET /api/leads/import-jobs/:id` | → `{ id, niche, location, status: "processing"\|"completed"\|"failed", importedCount, duplicateCount, errorCount, errorMessage, createdAt, completedAt }` |
| `POST /api/leads/:id/enrich` | Manual (re-)enrichment → the updated `Lead` |
| `PATCH /api/leads/:id/status` | `{ status: "new"\|"contacted"\|"opened"\|"replied"\|"converted" }` → the updated `Lead`. Manual/admin-only — `"converted"` has no automated trigger, this is the only way to set it. |
| `PATCH /api/leads/:id/debug-fields` | `{ email?: string \| null, website?: string }` → the updated `Lead`. `DEBUG=false` → `404`. Lets a lead's email/website be patched in by hand when a provider fails to fill them in — `LeadDetailDrawer` shows these as editable inputs (with a Save button) only when `useDebugMode()` is true. `email: ""` is stored as `null`. |
| `GET /api/leads/:id/activity` | → `ActivityEvent[]`, sorted oldest→newest: `{ id, kind: "sent"\|"opened"\|"replied"\|"follow_up"\|"converted", label, timestamp }`. Built from the lead's real `campaign_sends` rows (`sentAt`/`openedAt` per stage) plus its own `repliedAt`/`convertedAt` — not synthetic. Empty array if nothing's been sent yet. Matches the frontend's `ActivityEvent` type exactly; backs `LeadActivityDrawer`. |

**Lead shape returned everywhere:** `{ id, company, contactName, email, website, industry, status, enrichment, enrichmentAttempts, enrichmentError, campaignId, campaignName, painPoint, source, createdAt }` — a superset of the frontend's `Lead` type (extra fields `enrichmentAttempts`/`enrichmentError` are safe to ignore).

The status funnel is `new → contacted → opened → replied → converted`. Every freshly sourced lead (search or CSV) now starts at `"new"` — `"contacted"` is only set once a campaign's initial send actually succeeds (`emailWorker.ts`'s `processSend`), not at creation. This replaced the old behavior where every lead defaulted to `"contacted"` immediately, which made a lead nobody had emailed yet indistinguishable from one that had.

`GET /api/leads`, `GET /api/leads/:id`, `POST /api/leads/bulk-delete`, and `POST /api/leads/bulk-add-to-campaign` didn't exist when this doc was first written (they blocked `LeadsPage`/`TrackerPage`/`LeadDetailDrawer`/`LeadActivityDrawer` integration) — added alongside the frontend integration work itself, once it became clear they were a hard prerequisite rather than optional. There's still no push channel for background changes (enrichment completing, a status flipping) — see §11's polling note, now implemented as a 5s poll in `LeadsPage`.

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
| `POST /api/campaigns` | See body shape below → `201 Campaign`. Creates an empty campaign (`status: "draft"`, zero leads) — no `leadIds` in the body anymore. Add leads afterward via `POST /api/leads/bulk-add-to-campaign` (§4), which is what actually queues sends. |
| `GET /api/campaigns/:id` | → `Campaign` |
| `GET /api/campaigns/:id/leads` | → `Lead[]` currently assigned to this campaign, each with two extra fields: `initialSendStatus: SendStatus \| null` and `initialSendError: string \| null` — the lead's own `status` is its engagement funnel (stuck on `"new"` whether a send is queued or failed outright), so these two are what `CampaignLeadsTable`'s "Send status" column actually renders. `null` status means no `campaign_sends` row exists yet for that lead. |
| `PATCH /api/campaigns/:id/status` | `{ status: "draft"\|"sending"\|"active"\|"completed" }` → updated `Campaign`. Manual override (e.g. marking "completed"). |

**`POST /api/campaigns` body:**
```json
{
  "name": "string",
  "schedule": "immediate | scheduled",
  "scheduledAt": "ISO string or null",
  "followUps": {
    "day3": { "enabled": true, "subject": "string", "body": "string (supports {{firstName}}/{{company}})" },
    "day7": { "enabled": true, "subject": "string", "body": "string" }
  }
}
```
`schedule`/`scheduledAt` are stored on the campaign for later — every lead added afterward has its initial send delayed until `scheduledAt` (or sent right away if `schedule: "immediate"`), computed fresh each time a lead is added, not just once at creation.

**Campaign shape returned — differs from the frontend type:** `{ id, name, status, schedule, scheduledAt, followUpDay3Enabled, followUpDay3Subject, followUpDay3Body, followUpDay7Enabled, followUpDay7Subject, followUpDay7Body, createdAt, sentAt }`. Two real differences from the frontend's `Campaign` type:
- **No `leadIds` array on the response.** Membership is derived from `leads.campaignId`, not stored on the campaign. Call `GET /api/campaigns/:id/leads` for the member list (or ids: `.map(l => l.id)`).
- **Follow-ups are flattened**, not nested under a `followUps: { day3, day7 }` object. An adapter function is the cleanest fix on the frontend side rather than changing every read site — see `adaptCampaign`/`adaptFollowUps` in `frontend/src/lib/api/campaigns.ts`, which also fetches `.../leads` per campaign to backfill `leadIds` so the rest of the frontend never has to know either difference exists.

A lead is only ever eligible to be **added** to a campaign if it has a real email *and* an approved draft (`checkCampaignEligibility` in `campaignService.ts`) — ineligible leads aren't tagged with the campaign at all, they're rejected outright by `bulk-add-to-campaign` (§4), not silently added and left to fail at send time. `getCampaignLeads`'s member list is therefore always "who's actually reachable," not "who was selected."

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

There is no `GET /api/notifications/subscribe`-style push — the frontend mock's `subscribeToNotifications` (a same-tab event emitter over localStorage writes) has no server equivalent. `NotificationBell` polls `GET /api/notifications` every 20s instead (plus optimistic local state updates on read/mark-all/clear, so those feel instant). `LeadsPage` (5s) and `CampaignsPage` (8s) poll the same way, for the same reason — enrichment finishing, a status flipping, or a campaign's send stage advancing all happen server-side with no push channel. This is the integration path until/unless a websocket or SSE channel gets added.

## 8. Not built yet (don't integrate against these)

- **Settings' stored API keys aren't live** — `PUT /api/settings/api-keys/:provider` stores the key (encrypted) and shows it as connected, but the actual Apollo/Hunter/OpenRouter/Resend clients still read from `.env`, not from what's saved here. Don't expect saving a key in Settings to change enrichment/generation/sending behavior.

## 9. Analytics

| | |
|---|---|
| `GET /api/analytics/overview?dateFrom=&dateTo=` | → `{ total, openRate, replyRate, conversionRate }`. Both query params optional, ISO date strings, filtered on `leads.createdAt`. |
| `GET /api/analytics/series?dateFrom=&dateTo=` | → `{ opened, replied, converted }`, each a 14-point `{ date, value }[]` trend bucketed across the filtered range's span. Empty arrays if no lead in range has reached that status yet. |
| `GET /api/analytics/campaigns?dateFrom=&dateTo=` | → `CampaignBreakdownRow[]` — one row per campaign (`{ campaignId, campaignName, total, openRate, replyRate, conversionRate }`), including campaigns with zero leads in range. |

Shapes match the frontend's `AnalyticsOverview`/`AnalyticsSeries`/`CampaignBreakdownRow` types in `frontend/src/types/analytics.ts` exactly — `fetchAnalyticsOverview`/`fetchAnalyticsSeries`/`fetchCampaignBreakdown` in the mock are a drop-in swap once pointed at these URLs (query params via `?dateFrom=...&dateTo=...` instead of a body object).

⚠️ The series only reflects lead status changes that happened after this endpoint shipped (see `working.md`'s Known gaps) — a lead that was already `replied` beforehand won't show up in the `replied` trend, only in the overview/breakdown rates.

## 10. Settings & integrations

| | |
|---|---|
| `GET /api/settings/api-keys` | → `ApiKeyStatus[]`, one per provider (`apollo`\|`hunter`\|`openai`\|`resend`), always all four regardless of connection state |
| `PUT /api/settings/api-keys/:provider` | `{ value: string }` → updated `ApiKeyStatus`. Upsert — creates or replaces. The raw value is never echoed back, only a masked last-4. |
| `DELETE /api/settings/api-keys/:provider` | Disconnect → `204` |
| `GET /api/settings/sender-identity` | → `SenderIdentity` (singleton, auto-created with defaults on first call) |
| `PUT /api/settings/sender-identity` | Full `SenderIdentity` body → updated `SenderIdentity`. Unlike API keys, `smtpPassword` **is** returned in plaintext — this field is meant to be round-tripped back into the form, not write-only. |
| `GET /api/settings/profile` | → `ProfileSettings` for the authenticated user (`{ name, email }`) |
| `PUT /api/settings/profile` | `{ name, email }` → updated `ProfileSettings` |
| `DELETE /api/settings/data` | Danger zone "delete everything" → `204`. Wipes every lead, campaign, email draft, notification, and setting; **does not** delete the user account or log you out. |

Shapes match `frontend/src/types/settings.ts` exactly, so `frontend/src/lib/mock/settings.ts`'s functions are a drop-in swap. `:provider` must be one of the four values above or the request 400s.

## 11. Debug mode

There's no seed/fake-data mode anymore — every provider integration (Apollo, Hunter, OpenRouter, Resend, Slack/SMTP) always uses the real keys in `.env`, in both dev and prod. `DEBUG=true` (the local default) only changes a few dev/observability things, all with an identical HTTP contract either way:
- `POST /api/leads/search` returns 5 results per search instead of 25 (`apolloClient.ts`'s `DISCOVERY_RESULTS_PER_SEARCH`) — keeps a search from burning through Apollo credits while iterating.
- Follow-up sends fire after 15s/30s instead of 3/7 days (`followUpSchedule.ts`) — a campaign's `campaign_sends` rows visibly progress within a dev session.
- `POST /api/auth/password-reset/request` includes `devToken` in the response (see §2) instead of relying solely on the real email landing.
- **Every campaign send is redirected to `DEBUG_EMAIL_REDIRECT_TO`** instead of the lead's real address (`debugRecipient.ts`'s `resolveSendRecipient`). Resend refuses a real lead's address until a sending domain is verified — the API accepts the send, then fails it with "Domain is not verified" — so without this redirect no send in dev ever actually lands. It also means a dev machine can't email a real lead. The substitution is logged via `logger.warn`, so it shows up in the Debug panel rather than looking like a clean send. Never redirects when `DEBUG=false`.
- The in-app debug log (below) actually captures anything; with `DEBUG=false` it's always empty.

| | |
|---|---|
| `GET /api/debug/status` | Auth required → `{ enabled: boolean }`. `Topbar`'s Debug button only renders when this is `true` (`useDebugMode` hook). |
| `GET /api/debug/log` | Auth required → `DebugLogEntry[]`, newest last: `{ id, timestamp, level: "warn"\|"error", message, meta? }`. An in-memory ring buffer (last 200 `logger.warn`/`.error` calls process-wide — rate-limit hits, provider failures, etc.) — cleared on server restart, always `[]` when `DEBUG=false`. Backs `DebugPage`, polled every 5s. |

## 12. Multi-tenancy

Every account is a fully isolated tenant. All nine data tables (`leads`, `campaigns`, `campaign_sends`, `email_drafts`, `lead_import_jobs`, `notifications`, `api_key_credentials`, `notification_settings`, `sender_identity`) carry a `userId` with an `ON DELETE CASCADE` FK to `users` and an index, added by the `AddUserScoping` migration.

What this means for the frontend: **nothing changes in the request/response shapes** — no endpoint takes a `userId`, because it's always derived server-side from the session cookie (`req.user!.id`). The isolation is invisible from the client. Two things worth knowing:

- **Another account's ids behave as if they don't exist.** Fetching, patching, or generating against an id you don't own returns `404`, not `403` — so the UI's existing not-found handling already covers it. `POST /api/leads/bulk-delete` is the one exception: it returns `204` regardless, having deleted nothing, since a bulk delete is idempotent.
- **`DELETE /api/settings/data` only wipes the caller's rows**, not the whole database.
- **Deduplication is per-account**: lead search and CSV import only compare against *your* leads, so two accounts sourcing the same company each get their own copy instead of the second seeing it as a duplicate.

Verified end-to-end with two live accounts: each saw only its own leads/campaigns/industries/analytics/notifications, and every direct attempt by one account to read, mutate, delete, or reassign the other's records was refused with the other account's data left intact.
