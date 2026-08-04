import { AppNotification } from "../entities/AppNotification.js";
import { ApiKeyCredential } from "../entities/ApiKeyCredential.js";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { LeadImportJob } from "../entities/LeadImportJob.js";
import { NotificationSettings } from "../entities/NotificationSettings.js";
import { SenderIdentitySettings } from "../entities/SenderIdentitySettings.js";
import { User } from "../entities/User.js";
import { AppDataSource } from "../lib/dataSource.js";
import { decryptSecret, encryptSecret, maskSecret } from "../lib/encryption.js";
import { ApiError } from "../middleware/errorHandler.js";
import { API_KEY_PROVIDERS, type ApiKeyProvider, type ApiKeyStatus, type ProfileSettings, type SenderIdentity } from "../types/settings.js";

function apiKeys() {
  return AppDataSource.getRepository(ApiKeyCredential);
}

function senderIdentityRepo() {
  return AppDataSource.getRepository(SenderIdentitySettings);
}

function users() {
  return AppDataSource.getRepository(User);
}

export async function listApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  const stored = await apiKeys().find();
  const byProvider = new Map(stored.map((entry) => [entry.provider, entry]));

  return API_KEY_PROVIDERS.map((provider) => {
    const entry = byProvider.get(provider);
    return {
      provider,
      connected: Boolean(entry),
      maskedValue: entry?.maskedValue ?? null,
      updatedAt: entry?.updatedAt.toISOString() ?? null,
    };
  });
}

export async function saveApiKey(provider: ApiKeyProvider, rawValue: string): Promise<ApiKeyStatus> {
  const repo = apiKeys();
  const existing = await repo.findOne({ where: { provider } });
  const entry = existing ?? repo.create({ provider });

  entry.encryptedValue = encryptSecret(rawValue);
  entry.maskedValue = maskSecret(rawValue);
  const saved = await repo.save(entry);

  return { provider, connected: true, maskedValue: saved.maskedValue, updatedAt: saved.updatedAt.toISOString() };
}

export async function disconnectApiKey(provider: ApiKeyProvider): Promise<void> {
  await apiKeys().delete({ provider });
}

const DEFAULT_SENDER_IDENTITY_FIELDS = {
  fromName: "Emberline Outreach",
  fromEmail: "outreach@emberline.io",
  smtpFallbackEnabled: false,
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
};

async function getOrCreateSenderIdentity(): Promise<SenderIdentitySettings> {
  const repo = senderIdentityRepo();
  const [existing] = await repo.find({ take: 1 });
  if (existing) return existing;

  return repo.save(repo.create({ ...DEFAULT_SENDER_IDENTITY_FIELDS, smtpPasswordEncrypted: encryptSecret("") }));
}

function toSenderIdentity(entity: SenderIdentitySettings): SenderIdentity {
  return {
    fromName: entity.fromName,
    fromEmail: entity.fromEmail,
    smtpFallbackEnabled: entity.smtpFallbackEnabled,
    smtpHost: entity.smtpHost,
    smtpPort: entity.smtpPort,
    smtpUsername: entity.smtpUsername,
    smtpPassword: decryptSecret(entity.smtpPasswordEncrypted),
  };
}

export async function getSenderIdentity(): Promise<SenderIdentity> {
  return toSenderIdentity(await getOrCreateSenderIdentity());
}

export async function saveSenderIdentity(input: SenderIdentity): Promise<SenderIdentity> {
  const entity = await getOrCreateSenderIdentity();
  entity.fromName = input.fromName;
  entity.fromEmail = input.fromEmail;
  entity.smtpFallbackEnabled = input.smtpFallbackEnabled;
  entity.smtpHost = input.smtpHost;
  entity.smtpPort = input.smtpPort;
  entity.smtpUsername = input.smtpUsername;
  entity.smtpPasswordEncrypted = encryptSecret(input.smtpPassword);

  const saved = await senderIdentityRepo().save(entity);
  return toSenderIdentity(saved);
}

export async function getProfile(userId: string): Promise<ProfileSettings> {
  const user = await users().findOne({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  return { name: user.name ?? "", email: user.email };
}

export async function saveProfile(userId: string, input: ProfileSettings): Promise<ProfileSettings> {
  const user = await users().findOne({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  user.name = input.name;
  user.email = input.email.toLowerCase();
  const saved = await users().save(user);
  return { name: saved.name ?? "", email: saved.email };
}

// Danger-zone "delete everything" — mirrors the frontend mock's deleteAllData,
// which clears every localStorage key except the auth session. Deletes children
// before parents explicitly rather than relying on cascade config.
export async function deleteAllData(): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(CampaignSend).execute();
    await manager.createQueryBuilder().delete().from(EmailDraft).execute();
    await manager.createQueryBuilder().delete().from(AppNotification).execute();
    await manager.createQueryBuilder().delete().from(Lead).execute();
    await manager.createQueryBuilder().delete().from(Campaign).execute();
    await manager.createQueryBuilder().delete().from(LeadImportJob).execute();
    await manager.createQueryBuilder().delete().from(ApiKeyCredential).execute();
    await manager.createQueryBuilder().delete().from(NotificationSettings).execute();
    await manager.createQueryBuilder().delete().from(SenderIdentitySettings).execute();
  });
}
