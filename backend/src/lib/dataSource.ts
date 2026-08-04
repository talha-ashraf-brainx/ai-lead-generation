import "reflect-metadata";
import { DataSource } from "typeorm";
import { ApiKeyCredential } from "../entities/ApiKeyCredential.js";
import { AppNotification } from "../entities/AppNotification.js";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { LeadImportJob } from "../entities/LeadImportJob.js";
import { NotificationSettings } from "../entities/NotificationSettings.js";
import { SenderIdentitySettings } from "../entities/SenderIdentitySettings.js";
import { User } from "../entities/User.js";
import { AddLeadEnrichmentTracking1785842200000 } from "../migrations/1785842200000-AddLeadEnrichmentTracking.js";
import { AddLeadStatusTimestamps1785846000000 } from "../migrations/1785846000000-AddLeadStatusTimestamps.js";
import { InitCampaigns1785844000000 } from "../migrations/1785844000000-InitCampaigns.js";
import { InitEmailDrafts1785843000000 } from "../migrations/1785843000000-InitEmailDrafts.js";
import { InitLeads1785841376000 } from "../migrations/1785841376000-InitLeads.js";
import { InitNotifications1785845000000 } from "../migrations/1785845000000-InitNotifications.js";
import { InitSettings1785847000000 } from "../migrations/1785847000000-InitSettings.js";
import { InitUsers1785840825000 } from "../migrations/1785840825000-InitUsers.js";
import { env } from "./env.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  entities: [
    User,
    Lead,
    LeadImportJob,
    EmailDraft,
    Campaign,
    CampaignSend,
    AppNotification,
    NotificationSettings,
    ApiKeyCredential,
    SenderIdentitySettings,
  ],
  migrations: [
    InitUsers1785840825000,
    InitLeads1785841376000,
    AddLeadEnrichmentTracking1785842200000,
    InitEmailDrafts1785843000000,
    InitCampaigns1785844000000,
    InitNotifications1785845000000,
    AddLeadStatusTimestamps1785846000000,
    InitSettings1785847000000,
  ],
  synchronize: false,
  logging: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
});
