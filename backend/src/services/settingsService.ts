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

export async function listApiKeyStatuses(userId: string): Promise<ApiKeyStatus[]> {
  const stored = await apiKeys().find({ where: { userId } });
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

export async function saveApiKey(provider: ApiKeyProvider, rawValue: string, userId: string): Promise<ApiKeyStatus> {
  const repo = apiKeys();
  const existing = await repo.findOne({ where: { provider, userId } });
  const entry = existing ?? repo.create({ provider, userId });

  entry.encryptedValue = encryptSecret(rawValue);
  entry.maskedValue = maskSecret(rawValue);
  const saved = await repo.save(entry);

  return { provider, connected: true, maskedValue: saved.maskedValue, updatedAt: saved.updatedAt.toISOString() };
}

export async function disconnectApiKey(provider: ApiKeyProvider, userId: string): Promise<void> {
  await apiKeys().delete({ provider, userId });
}

const DEFAULT_SENDER_IDENTITY_FIELDS = {
  fromName: "Emberline Outreach",
  fromEmail: "outreach@emberline.io",
  smtpFallbackEnabled: false,
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
};

async function getOrCreateSenderIdentity(userId: string): Promise<SenderIdentitySettings> {
  const repo = senderIdentityRepo();
  const existing = await repo.findOne({ where: { userId } });
  if (existing) return existing;

  return repo.save(repo.create({ ...DEFAULT_SENDER_IDENTITY_FIELDS, userId, smtpPasswordEncrypted: encryptSecret("") }));
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

export async function getSenderIdentity(userId: string): Promise<SenderIdentity> {
  return toSenderIdentity(await getOrCreateSenderIdentity(userId));
}

export async function saveSenderIdentity(input: SenderIdentity, userId: string): Promise<SenderIdentity> {
  const entity = await getOrCreateSenderIdentity(userId);
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

// Danger-zone "delete everything" — scoped to the calling account only, so one user
// wiping their data can't touch another's. Deletes children before parents explicitly
// rather than relying on cascade config.
export async function deleteAllData(userId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    for (const entity of [
      CampaignSend,
      EmailDraft,
      AppNotification,
      Lead,
      Campaign,
      LeadImportJob,
      ApiKeyCredential,
      NotificationSettings,
      SenderIdentitySettings,
    ]) {
      await manager.createQueryBuilder().delete().from(entity).where("userId = :userId", { userId }).execute();
    }
  });
}
