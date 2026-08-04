# API Endpoints

Base URL: `http://localhost:4001/api`

## Health
- `GET /health`

```
GET http://localhost:4001/api/health
```

## Auth
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

```
POST http://localhost:4001/api/auth/login
Body: { "email": "owner@emberline.dev", "password": "changeme123" }
```

## Leads
- `POST /leads/csv/preview`
- `POST /leads/csv/import`
- `POST /leads/search`
- `POST /leads/:id/enrich`
- `PATCH /leads/:id/status`
- `GET /leads/import-jobs/:id`

```
POST http://localhost:4001/api/leads/search
Body: { "niche": "dentists", "location": "Austin, TX" }
```

## Email Drafts
- `POST /email-drafts/bulk-generate`
- `GET /email-drafts/:leadId`
- `POST /email-drafts/:leadId/generate`
- `PATCH /email-drafts/:leadId`

```
POST http://localhost:4001/api/email-drafts/123/generate
```

## Campaigns
- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id`
- `GET /campaigns/:id/leads`
- `PATCH /campaigns/:id/status`

```
POST http://localhost:4001/api/campaigns
Body: { "name": "Q1 Outreach", "leadIds": ["123"], "schedule": "immediate", "followUps": { "day3": true, "day7": true } }
```

## Notifications
- `GET /notifications`
- `POST /notifications/read-all`
- `POST /notifications/:id/read`
- `DELETE /notifications`
- `GET /notifications/settings`
- `PUT /notifications/settings`
- `POST /notifications/settings/test-slack`

```
GET http://localhost:4001/api/notifications
```

## Analytics
- `GET /analytics/overview`
- `GET /analytics/series`
- `GET /analytics/campaigns`

```
GET http://localhost:4001/api/analytics/overview?dateFrom=2026-07-01&dateTo=2026-08-01
```

## Settings
- `GET /settings/api-keys`
- `PUT /settings/api-keys/:provider`
- `DELETE /settings/api-keys/:provider`
- `GET /settings/sender-identity`
- `PUT /settings/sender-identity`
- `GET /settings/profile`
- `PUT /settings/profile`
- `DELETE /settings/data`

```
PUT http://localhost:4001/api/settings/api-keys/apollo
Body: { "value": "sk-..." }
```

## Webhooks
- `POST /webhooks/sendgrid`
- `POST /webhooks/sendgrid-inbound`

```
POST http://localhost:4001/api/webhooks/sendgrid-inbound?token=<INBOUND_PARSE_SECRET>
```
