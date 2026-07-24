# Software Requirements Specification
## AI-Powered Lead Generation and Outreach Automation

### 1. Overview
A system that imports/scrapes target business leads, enriches them with contact data, generates personalized cold emails using AI, sends them with automated follow-ups, and tracks engagement through a CRM-style dashboard.

**Demo flow:** User enters "dental clinics in London" → system fetches 20 leads with emails → GPT writes a personalized email per lead → emails are sent → dashboard shows contacted/opened/replied counts → non-openers get a day-3 follow-up.

---

### 2. Scope

#### 2.1 In Scope
- Lead input via CSV upload or niche/location keyword search
- Lead enrichment (company, contact name, email, website) via Apollo.io or Hunter.io
- AI-generated personalized cold email per lead (GPT-4, based on company/industry/pain point)
- Email sending via SendGrid or SMTP
- Automated 2-step follow-up sequence (day 3, day 7) for non-repliers
- Lead tracker dashboard: contacted, opened, replied, converted
- Reply notifications via Slack or email
- Basic analytics: open rate, reply rate, conversion rate
- Single-user authentication (login-gated dashboard)

#### 2.2 Out of Scope
- Multi-tenant / team accounts and role-based permissions
- Built-in web scraper (v1 relies on third-party enrichment APIs, not custom scraping infra)
- Two-way email inbox / full conversation threading (reply detection only, not a reply UI)
- A/B testing of email copy or send times
- CRM integrations beyond internal tracker (e.g., HubSpot, Salesforce sync)
- SMS/LinkedIn/multi-channel outreach
- Billing, subscription, or usage metering
- Deliverability/warm-up tooling (dedicated IP warm-up, domain reputation management)
- Advanced analytics (cohort analysis, revenue attribution)

---

### 3. Core Features & Functional Requirements

| # | Feature | Description |
|---|---------|-------------|
| 1 | Lead Input | CSV upload or keyword+location search to source leads |
| 2 | Enrichment | Fetch company name, contact name, email, website via Apollo.io/Hunter.io API |
| 3 | AI Email Generation | GPT-4 generates a personalized email per lead using company/industry/pain-point context |
| 4 | Email Sending | Send via SendGrid API (or SMTP fallback), track message IDs |
| 5 | Follow-up Sequencing | Auto-send follow-up on day 3 and day 7 if no reply detected |
| 6 | Lead Tracker | Status per lead: contacted → opened → replied → converted |
| 7 | Reply Detection & Alerts | Detect inbound replies, notify via Slack webhook or email |
| 8 | Analytics Dashboard | Open rate, reply rate, conversion rate (aggregate + per-campaign) |

---

### 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js (Express) |
| Database | PostgreSQL |
| Job Queue / Scheduling | BullMQ (Redis-backed) for follow-up scheduling |
| Lead Enrichment | Apollo.io API or Hunter.io API |
| AI Generation | OpenAI GPT-4 API |
| Email Delivery | SendGrid API (webhooks for open/reply tracking) |
| Notifications | Slack Incoming Webhooks / Nodemailer for email alerts |
| Auth | JWT-based auth (Passport.js) or Clerk |
| Hosting | Netlify/Vercel (static frontend) + Railway/Render (API, worker, Redis, Postgres) |
| File Parsing | PapaParse (CSV parsing) |

---

### 5. Development Acceleration Techniques
- **Managed Postgres (Supabase/Neon/Railway)** to skip DB provisioning and ops
- **SendGrid webhooks** for open/click/reply events instead of building custom tracking pixels
- **Official OpenAI Node SDK** for straightforward GPT-4 integration
- **Prebuilt UI kits** (shadcn/ui, Tailwind UI) for dashboard, tables, and forms instead of custom components
- **BullMQ + Upstash Redis** for follow-up scheduling instead of a custom cron/worker system
- **Apollo/Hunter official SDKs or REST clients** instead of hand-rolled scraping
- **Seed/mock mode:** stub enrichment + email APIs during development to iterate on UI/flow without burning API credits
- **npm workspaces monorepo** (client + server in one repo) to keep shared types/config in sync without a heavier framework
