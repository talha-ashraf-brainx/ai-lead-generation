# Dev-Required Setup

Manual steps only you can do. Everything else is done in code.

Nothing blocks local dev — `SEED_MODE=true` (the default) exercises every phase through Phase 6 without any of the items below. They only matter once you flip `SEED_MODE=false` to test against real providers.

## Outstanding (only needed for real-provider testing, not seed mode)

- **Phase 5 — SendGrid:** `SENDGRID_API_KEY` is blank. You'll also need to verify a sender identity (Settings > Sender Authentication) matching `SENDGRID_FROM_EMAIL` before SendGrid will accept sends.
- **Phase 6 — Inbound Parse (reply detection):** requires DNS you control:
  1. Add an MX record for `INBOUND_REPLY_DOMAIN` (default `reply.emberline.dev`) pointing to `mx.sendgrid.net`.
  2. In SendGrid: Settings > Inbound Parse > Add Host & URL — host = that domain, destination URL = `https://<your-api-host>/api/webhooks/sendgrid-inbound?token=<INBOUND_PARSE_SECRET>`.
  3. Set `INBOUND_PARSE_SECRET` in `.env` to whatever token you used above (left blank, the endpoint still works but skips auth and logs a warning — fine for dev, not for a public deploy).
- **Phase 5 — Event Webhook signing (optional but recommended before deploy):** Settings > Mail Settings > Event Webhook > Signed Event Webhook Requests, then put that verification key in `SENDGRID_WEBHOOK_VERIFICATION_KEY`. Blank is fine for local dev (logged warning, no verification).

**For reference:** before deploying (Phase 10), swap the local `DATABASE_URL` for a managed Postgres instance (Supabase/Neon/Railway) and set `SEED_MODE=false`.
