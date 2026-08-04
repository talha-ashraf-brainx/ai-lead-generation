# Build Report

Plain-English walkthrough of what the Emberline backend does, in order. See `backend-plan.md` for the phase checklist, `frontend-integration.md` for the API contract.

## What it's built with

| Piece | Tool | Job |
|---|---|---|
| Server | Node + Express | Handles all API requests |
| Database | Postgres (via TypeORM) | Stores leads, campaigns, users, etc. |
| Background jobs | Redis + BullMQ | Queues and runs email sends/follow-ups |
| Lead data | Apollo, Hunter | Find contact/email/company info |
| Email writing | OpenRouter (AI) | Drafts subject + body per lead |
| Email sending | SendGrid | Sends emails, tracks opens/clicks/replies |
| Alerts | Slack webhook, Nodemailer | Notify you of replies/conversions |

One command runs it all: `npm run dev:backend`.

## Where it stands

Everything works end-to-end (login → leads → emails → sending → replies → analytics → settings), and the real frontend is now wired up to it (`frontend/src/lib/api/*` — the old localStorage mock layer is gone). Only thing left: deploying.

## The flow, step by step

1. **Log in.** One owner account. A cookie keeps you logged in.

2. **Get leads.** Either upload a CSV, or search by keyword/location. Either way, leads start out "pending enrichment."

3. **Enrichment fills in the blanks.** For each lead, it tries to find contact/email/website info — first via Apollo, then Hunter if that fails. Retries a couple times if it doesn't work.

4. **AI writes an email.** For each lead, an AI (via OpenRouter) drafts a subject + body based on the company info. You can edit it and approve it.

5. **You build a campaign** by picking approved leads. This queues up a send for each one.

6. **Sending happens in the background.** A worker sends the emails through SendGrid. If a lead doesn't reply, it automatically follows up again on day 3 and day 7 — unless the lead already replied or converted, in which case it skips them.

7. **Replies and opens are tracked automatically.** SendGrid tells us when someone opens an email or replies, and the lead's status updates itself: contacted → opened → replied. "Converted" is the one status a human has to set manually — there's no way to auto-detect a closed deal.

8. **You get notified.** A reply or a conversion pops up in-app, and optionally pings Slack or sends an email alert. Follow-up sends don't alert — that would be too noisy.

9. **Analytics** shows open/reply/conversion rates and a trend chart, computed straight from lead statuses.

10. **Settings** lets you store your API keys (encrypted, never shown again — just "connected" or not) and your sender info. There's also a "delete everything" button that wipes all your data.

## Redis & BullMQ — what they're actually for

Sending an email isn't instant — it has to happen at the right time (now, or 3/7 days later) without holding up the API request. That's what this pair handles:

- **Redis** is just the storage BullMQ uses to keep track of jobs (what's queued, what's delayed, what's done).
- **BullMQ** is the queue library on top of it — a `Queue` adds jobs, a `Worker` (running in the same process as the API for now) picks them up and runs them.

How it's used here:
- Creating a campaign adds one "send this email" job per lead to the queue.
- The worker pulls each job and sends it via SendGrid.
- After a successful send, the worker schedules the next follow-up (day 3, then day 7) as a **delayed** job — it doesn't exist in the queue until the prior stage actually sends.
- Before running a follow-up job, the worker checks the lead's current status — if they've already replied or converted, it marks that job `skipped` instead of sending.
- In demo mode, those delays shrink from days to 15s/30s so you can watch the whole sequence happen live.

Without this, follow-up scheduling would mean either blocking the server for days or writing a custom scheduler — BullMQ + Redis gives us "run this later, reliably" for free.

## Demo mode (no real API keys needed)

By default (`SEED_MODE=true`), nothing real happens — it's all faked so you can try the whole app instantly:
- Leads are made-up companies, not real search results
- Enrichment "succeeds" ~90% of the time, randomly
- Emails come from a few rotating templates instead of a real AI call
- Sends are fake, but still simulate opens
- Follow-up waits are seconds instead of days
- Alerts are logged instead of actually sent

Turn it off (`SEED_MODE=false`) once real API keys are in `.env` — see `dev-required.md` for the setup that requires.

## What's not done yet

- Searching for leads by keyword only works in demo mode — real lead discovery isn't built.
- Trend charts only have data going back to when that tracking was added — older status changes aren't in there.
- Saved API keys in Settings aren't actually used anywhere yet — the app still uses whatever's in `.env`.
- No push channel for background changes (enrichment finishing, a status flipping) — the frontend polls instead (leads every 5s, campaigns every 8s, notifications every 20s).

## Tests

`npm run test --workspace=backend` — covers logic-only code (no database calls): status rules, templating, parsing, analytics math, encryption. Everything else is tested by hand.

## Running it

```
brew services start postgresql@16
brew services start redis
npm run dev:backend
```

First time: `npm run db:migrate --workspace=backend` then `npm run db:seed --workspace=backend`. Env vars are listed in `backend/.env.example`.
