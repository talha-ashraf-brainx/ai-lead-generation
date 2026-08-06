import "dotenv/config";

function str(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

function num(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name] ? value : fallback;
}

const INSECURE_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me";
const INSECURE_DEV_ENCRYPTION_KEY = "dev-only-insecure-encryption-key-change-me";

export const env = {
  nodeEnv: str("NODE_ENV", "development"),
  port: num("PORT", 4000),
  databaseUrl: str("DATABASE_URL", "postgresql://localhost:5432/emberline"),
  // Controls dev/observability behavior only (search result volume, follow-up timing,
  // the dev-only password-reset token, the in-memory debug log) — every provider
  // integration always uses real keys regardless of this flag.
  debug: str("DEBUG", "false") === "true",
  corsOrigin: str("CORS_ORIGIN", "http://localhost:5173"),
  jwtSecret: str("JWT_SECRET", INSECURE_DEV_JWT_SECRET),
  jwtExpiresIn: str("JWT_EXPIRES_IN", "7d"),
  passwordResetTokenTtlMinutes: num("PASSWORD_RESET_TOKEN_TTL_MINUTES", 30),
  accountOwnerEmail: str("ACCOUNT_OWNER_EMAIL", "owner@emberline.dev"),
  accountOwnerPassword: str("ACCOUNT_OWNER_PASSWORD", "changeme123"),
  accountOwnerName: str("ACCOUNT_OWNER_NAME", "Account Owner"),
  apolloApiKey: str("APOLLO_API_KEY", ""),
  hunterApiKey: str("HUNTER_API_KEY", ""),
  // AI email generation goes through OpenRouter (OpenAI-compatible API) rather than
  // OpenAI directly — same `openai` SDK, different base URL/key/model naming.
  openrouterApiKey: str("OPENROUTER_API_KEY", ""),
  openrouterModel: str("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
  redisUrl: str("REDIS_URL", "redis://localhost:6379"),
  resendApiKey: str("RESEND_API_KEY", ""),
  // Sandboxed default — no verified domain yet, so this must stay Resend's shared
  // onboarding@resend.dev sender. Swap for a real address once a domain is verified
  // (Resend Dashboard > Domains); until then Resend also restricts recipients to the
  // account's own signup email or its resend.dev test addresses (see dev-required.md).
  resendFromEmail: str("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
  resendFromName: str("RESEND_FROM_NAME", "Emberline Outreach"),
  resendWebhookSecret: str("RESEND_WEBHOOK_SECRET", ""),
  resendInboundWebhookSecret: str("RESEND_INBOUND_WEBHOOK_SECRET", ""),
  // Debug-mode-only send redirect. Resend rejects real lead addresses until a sending
  // domain is verified, so in debug mode every send goes here instead. Defaults to
  // Resend's always-deliverable test sink; set it to your Resend signup email to
  // actually read the emails. Ignored entirely when DEBUG=false.
  debugEmailRedirectTo: str("DEBUG_EMAIL_REDIRECT_TO", "delivered@resend.dev"),
  // Reply detection — added in Phase 6 (Resend inbound email). No default: a made-up
  // domain here would put an unresolvable Reply-To on every outbound send. Blank means
  // sends carry no Reply-To and reply detection is off (see dev-required.md).
  inboundReplyDomain: str("INBOUND_REPLY_DOMAIN", ""),
  // Notifications — added in Phase 7. Nodemailer/SMTP for internal alert emails
  // ("a lead replied") — distinct from Resend, which is outreach-only.
  smtpHost: str("SMTP_HOST", ""),
  smtpPort: num("SMTP_PORT", 587),
  smtpUsername: str("SMTP_USERNAME", ""),
  smtpPassword: str("SMTP_PASSWORD", ""),
  smtpFromEmail: str("SMTP_FROM_EMAIL", "alerts@emberline.dev"),
  smtpFromName: str("SMTP_FROM_NAME", "Emberline Alerts"),
  // Settings module — added in Phase 9. Encrypts stored API keys / SMTP password at
  // rest (AES-256-GCM, see lib/encryption.ts). Distinct from JWT_SECRET so rotating
  // one doesn't invalidate the other.
  settingsEncryptionKey: str("SETTINGS_ENCRYPTION_KEY", INSECURE_DEV_ENCRYPTION_KEY),
};

if (env.nodeEnv === "production" && env.jwtSecret === INSECURE_DEV_JWT_SECRET) {
  throw new Error("JWT_SECRET must be set to a real secret in production");
}

if (env.nodeEnv === "production" && env.settingsEncryptionKey === INSECURE_DEV_ENCRYPTION_KEY) {
  throw new Error("SETTINGS_ENCRYPTION_KEY must be set to a real secret in production");
}
