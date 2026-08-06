# Dev-Required Setup

Manual steps only you can do. Everything else is done in code.

Nothing blocks local dev — `SEED_MODE=true` (the default) exercises every phase through Phase 6 without any of the items below. They only matter once you flip `SEED_MODE=false` to test against real providers.

## Outstanding (only needed for real-provider testing, not seed mode)

- **Phase 5 — Resend, no domain yet:** `RESEND_API_KEY` is set, but there's no verified sending domain, so `RESEND_FROM_EMAIL` stays Resend's shared `onboarding@resend.dev` sandbox sender. Without a verified domain, Resend restricts recipients to **the account's own signup email** or its special `resend.dev` test addresses (`delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`) — see https://resend.com/docs/dashboard/emails/send-test-emails. That means flipping `SEED_MODE=false` right now will send real campaign emails to your own inbox only, not to actual leads. To send to real leads, verify a domain (Resend Dashboard > Domains) and update `RESEND_FROM_EMAIL`/`RESEND_FROM_NAME` accordingly.
- **Phase 5 — Event webhook:** in the Resend Dashboard, create a webhook pointing at `https://<your-api-host>/api/webhooks/resend` subscribed to `email.sent`/`email.delivered`/`email.bounced`/`email.opened`/`email.clicked`/`email.failed`, then put its signing secret in `RESEND_WEBHOOK_SECRET`. Blank is fine for local dev (logged warning, no verification). Works today even without a verified domain — sends from the sandbox sender still fire these events.
- **Phase 6 — Inbound email (reply detection), no domain yet:** custom receiving domains need DNS you control, but Resend also offers a managed `<random-id>.resend.app` address with no DNS setup (Dashboard > Receiving). To wire this up:
  1. Grab your `<id>.resend.app` address from Dashboard > Receiving and set `INBOUND_REPLY_DOMAIN` to it.
  2. Create a webhook subscribed to `email.received`, destination URL `https://<your-api-host>/api/webhooks/resend-inbound`.
  3. Put that webhook's signing secret in `RESEND_INBOUND_WEBHOOK_SECRET` (left blank, the endpoint still works but skips auth and logs a warning — fine for dev, not for a public deploy).
  4. Once a real domain is verified, switch `INBOUND_REPLY_DOMAIN` to a custom receiving subdomain (Dashboard > Receiving > Add Domain, which adds the MX record for you) instead.

**For reference:** before deploying (Phase 10), swap the local `DATABASE_URL` for a managed Postgres instance (Supabase/Neon/Railway) and set `SEED_MODE=false`.
