# Frontend Build Plan
## AI-Powered Lead Generation and Outreach Automation

Stack: Vite + React + TypeScript + React Router. Built phase by phase, module by module. Check items off as they're completed.

### Development Approach
- **Prototype-first:** every module is built fully functional against a local mock data/service layer (`src/lib/mock/`), not a real backend. Mock functions mirror the real API's future function signatures, so swapping in the real backend later means changing the implementation inside `lib/`, not the pages/components that call it.
- **Design:** UI is designed using the `frontend-design` skill — a deliberate, subject-specific visual identity defined once (see Design System below) and reused across every phase, rather than generic Tailwind defaults.

### Design System — "Emberline"
- **Concept:** the product is framed as an outreach *instrument panel*. The signature visual device is the **Signal Temperature** scale — a cold → hot gradient mapped directly to lead status (contacted → opened → replied → converted), reused everywhere status appears (badges, tracker, analytics).
- **Color:** Graphite `#10131A/#171B24/#1E232E` (dark base/surfaces), Fog `#F6F7F9/#ECEDF1` (light neutral), Slate `#8890A0` (muted text), Primary `#3E6FD9`. Signal Temperature: Cold `#3E6FD9` (contacted) → Cool `#8B6FD9` (opened) → Warm `#E08A3C` (replied) → Hot `#FF5A36` (converted).
- **Type:** Space Grotesk (display/headings), IBM Plex Sans (body/UI), IBM Plex Mono (data, stats, labels — reinforces the "instrument readout" feel).
- **Tokens live in:** `frontend/src/index.css` (Tailwind v4 `@theme`).

---

## Phase 0 — Project Foundation
- [x] Scaffold project with Vite (`react-ts` template)
- [x] Install and wire up React Router (`react-router-dom`)
- [x] Verify dev server and production build run cleanly
- [x] Install & configure Tailwind CSS (v4, CSS-first `@theme` tokens + self-hosted fonts via `@fontsource`)
- [x] Base folder structure (`pages/`, `components/ui/`, `routes/`, `context/`, `lib/mock/`, `hooks/`, `types/`)
- [x] Mock service layer (`lib/mock/`) in place of a real API client — swapped for a real client when the backend exists
- [x] Global providers — `AuthProvider` wired in `App.tsx`; theme is a static dark instrument-panel palette (no light/dark toggle yet); query client (React Query or similar) deferred until real backend calls exist
- [x] Lint/format setup (`oxlint`, included by the Vite template, + Prettier added)

**Design requirements:** No visual UI yet — this phase is purely structural/tooling. Design tokens (see Design System) were defined here so every later phase draws from the same system.

---

## Phase 1 — Auth Module
- [x] Login page
- [~] Signup page — skipped for v1; SRS scopes this as single-user auth, no self-serve signup
- [x] Forgot/reset password flow (mock: request form + confirmation state, no real email sent)
- [x] Auth context + protected route wrapper
- [x] Persisted session (mock user persisted to `localStorage`, rehydrated on load)
- [x] Form validation + error states (required fields, invalid-credential error banner)

**Design requirements:**
- Built as the signature design moment: split-screen layout — dark brand panel on the left carrying the **Signal Temperature** strip (Contacted → Opened → Replied → Converted, using the demo flow's own numbers), sign-in form on the right
- Demo credentials shown directly on the form (prototype has one seeded account, no real backend to register against)
- Clear inline validation errors, disabled submit while loading
- Redirect to dashboard on success, preserve intended destination on protected-route bounce

---

## Phase 2 — App Shell & Navigation
> The placeholder `DashboardPage` has been removed; `AppLayout` is now the post-login shell and `/leads` is the default landing route.
- [x] Dashboard layout (sidebar + topbar + content area)
- [x] Sidebar navigation (Leads, Campaigns, Analytics, Settings)
- [x] Topbar (user menu, logout, notifications bell)
- [x] Responsive collapse (sidebar → hamburger on mobile)
- [x] Empty/loading/error state patterns (shared components used across modules)

**Design requirements:**
- Consistent spacing/typography scale via Tailwind config (colors, fonts defined once)
- Active-route highlighting in sidebar
- Layout must not reflow/jank when switching pages (persistent shell, routed content only)

---

## Phase 3 — Lead Input Module
- [x] CSV upload UI (drag-and-drop + file picker, preview parsed rows before import)
- [x] Keyword/niche + location search form (e.g. "dental clinics in London")
- [x] Import progress/result summary (rows imported, duplicates skipped, errors)
- [x] Validation feedback (missing columns, malformed rows)

**Design requirements:**
- Upload zone with clear affordance (dashed border, hover state, file-type hint)
- Table preview of parsed CSV before confirming import
- Non-blocking progress indicator for keyword-search scraping (can take several seconds)

---

## Phase 4 — Leads Module (Enrichment & List)
- [x] Leads table (company, contact, email, website, status)
- [x] Row-level enrichment status (pending/enriched/failed)
- [x] Lead detail drawer/page (full enriched profile)
- [x] Filters + search (by status, industry, campaign)
- [x] Pagination / infinite scroll for large lead lists
- [x] Bulk actions (select rows → add to campaign, delete)

**Design requirements:**
- Dense, scannable table with sticky header
- Status shown as color-coded badges (contacted / opened / replied / converted)
- Detail view reachable without losing table scroll position/filters

---

## Phase 5 — AI Email Generation & Review
- [x] Generate-email trigger (per lead or bulk for a campaign)
- [x] Email preview/edit screen (subject + body, editable before send)
- [x] Regenerate option (re-run AI generation with same lead context)
- [x] Personalization variables shown (company, industry, pain point used)
- [x] Loading/error states for generation calls

**Design requirements:**
- Side-by-side or stacked layout: lead context on one side, editable email on the other
- Clear distinction between "AI draft" and "edited/approved" state
- Character/length guidance for subject line

---

## Phase 6 — Campaigns & Outreach Module
- [x] Campaign creation (select leads, review generated emails, confirm send)
- [x] Send scheduling (immediate vs scheduled)
- [x] Follow-up sequence config (day 3 / day 7 toggle, editable follow-up templates)
- [x] Campaign list (status: draft, sending, active, completed)
- [x] Campaign detail view (per-lead send status within the campaign)

**Design requirements:**
- Multi-step flow (select leads → review emails → configure follow-ups → confirm) with clear step indicator
- Confirmation step before irreversible send action
- Follow-up timeline visualized simply (day 0 / day 3 / day 7)

---

## Phase 7 — Lead Tracker Dashboard
- [x] Pipeline view: contacted → opened → replied → converted
- [x] Kanban-style board or status-grouped table (toggle if time allows)
- [x] Per-lead activity timeline (sent, opened, replied, follow-up sent)
- [x] Quick filters by campaign/date range

**Design requirements:**
- Visual funnel/summary counts at top (matches demo flow: 20 contacted, 8 opened, 3 replied)
- Consistent status color coding with Leads module (Phase 4)

---

## Phase 8 — Notifications Module
- [x] In-app notification list/bell dropdown (new replies)
- [x] Notification settings (Slack webhook URL, email alert toggle)
- [x] Mark as read / clear notifications

**Design requirements:**
- Unread indicator (badge count) on topbar bell
- Settings form with test/verify button for Slack webhook

---

## Phase 9 — Analytics Module
- [x] Overview stat cards (open rate, reply rate, conversion rate)
- [x] Trend chart(s) over time
- [x] Per-campaign breakdown table
- [x] Date range filter

**Design requirements:**
- Charting library decision made before build (e.g. Recharts)
- Stat cards readable at a glance; charts secondary to numbers
- Consistent color coding with status colors used elsewhere

---

## Phase 10 — Settings Module
- [x] API key management (Apollo/Hunter, OpenAI, SendGrid) — masked inputs
- [x] Sender identity config (from name/email, SMTP fallback if used)
- [x] Account/profile settings
- [x] Danger zone (disconnect integrations, delete data)

**Design requirements:**
- Grouped settings sections with clear save/cancel per section
- Masked secrets with reveal toggle; never show full key after save

---

## Phase 11 — Polish Pass
- [x] Responsive check across all modules (mobile/tablet breakpoints)
- [x] Global error boundary + 404 page
- [x] Loading skeletons for all data-fetching views
- [x] Accessibility pass (keyboard nav, focus states, contrast)
- [x] Empty-state illustrations/copy for all list views

**Design requirements:** Cross-cutting — applied to all modules above, done last once module UIs are stable.

---

## Status Legend
- [x] Done
- [~] Skipped / descoped (reason noted inline)
- [ ] Not started / in progress
