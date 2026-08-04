import { AppNotification } from "../entities/AppNotification.js";
import { Lead } from "../entities/Lead.js";
import { NotificationSettings } from "../entities/NotificationSettings.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { sendAlertEmail } from "../lib/mailer.js";
import { sendSlackAlert } from "../lib/slackClient.js";
import { ApiError } from "../middleware/errorHandler.js";

const SLACK_WEBHOOK_PATTERN = /^https:\/\/hooks\.slack\.com\/services\//;

function notifications() {
  return AppDataSource.getRepository(AppNotification);
}

function settingsRepo() {
  return AppDataSource.getRepository(NotificationSettings);
}

async function getOrCreateSettings(): Promise<NotificationSettings> {
  const repo = settingsRepo();
  const [existing] = await repo.find({ take: 1 });
  if (existing) return existing;
  return repo.save(repo.create({}));
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return getOrCreateSettings();
}

export async function saveNotificationSettings(input: {
  slackEnabled: boolean;
  slackWebhookUrl: string;
  emailAlertsEnabled: boolean;
}): Promise<NotificationSettings> {
  const settings = await getOrCreateSettings();
  settings.slackEnabled = input.slackEnabled;
  settings.slackWebhookUrl = input.slackWebhookUrl || null;
  settings.emailAlertsEnabled = input.emailAlertsEnabled;
  return settingsRepo().save(settings);
}

export async function testSlackWebhook(url: string): Promise<{ success: boolean; message: string }> {
  const trimmed = url.trim();
  if (!SLACK_WEBHOOK_PATTERN.test(trimmed)) {
    return { success: false, message: "That doesn't look like a Slack webhook URL." };
  }

  if (env.seedMode) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { success: true, message: "Test alert sent — check your Slack channel." };
  }

  try {
    await sendSlackAlert(trimmed, ":white_check_mark: Emberline test alert — your Slack integration is connected.");
    return { success: true, message: "Test alert sent — check your Slack channel." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to send test alert." };
  }
}

export async function listNotifications(): Promise<AppNotification[]> {
  return notifications().find({ order: { createdAt: "DESC" } });
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const repo = notifications();
  const notification = await repo.findOne({ where: { id } });
  if (!notification) throw new ApiError(404, "Notification not found");

  notification.read = true;
  return repo.save(notification);
}

export async function markAllNotificationsRead(): Promise<void> {
  await notifications().update({ read: false }, { read: true });
}

export async function clearNotifications(): Promise<void> {
  await notifications().clear();
}

// Fire-and-forget — a Slack/email failure must never break the flow that triggered
// the notification (reply detection, a manual conversion, a follow-up send).
async function dispatchExternalAlerts(kind: "reply" | "conversion", title: string, detail: string): Promise<void> {
  const settings = await getOrCreateSettings();

  if (settings.slackEnabled && settings.slackWebhookUrl) {
    if (env.seedMode) {
      logger.info("Seed mode: skipping real Slack alert", { title });
    } else {
      try {
        await sendSlackAlert(settings.slackWebhookUrl, `*${title}*\n${detail}`);
      } catch (err) {
        logger.error("Slack alert failed", { error: err instanceof Error ? err.message : err });
      }
    }
  }

  // Per the frontend's own copy for this toggle ("Get an email when a lead
  // replies") — email alerts are reply-only, not sent for conversions.
  if (kind === "reply" && settings.emailAlertsEnabled) {
    if (env.seedMode) {
      logger.info("Seed mode: skipping real alert email", { title });
    } else {
      try {
        await sendAlertEmail({ subject: title, text: detail });
      } catch (err) {
        logger.error("Alert email failed", { error: err instanceof Error ? err.message : err });
      }
    }
  }
}

export async function notifyReply(lead: Lead): Promise<void> {
  const title = `${lead.contactName} replied`;
  const detail = `${lead.contactName} at ${lead.company} replied to your outreach${lead.campaignName ? ` (${lead.campaignName})` : ""}.`;

  await notifications().save(
    notifications().create({ kind: "reply", title, detail, leadId: lead.id, campaignId: lead.campaignId }),
  );
  void dispatchExternalAlerts("reply", title, detail);
}

export async function notifyConversion(lead: Lead): Promise<void> {
  const title = `${lead.company} converted`;
  const detail = `${lead.company} was marked as converted${lead.campaignName ? ` in ${lead.campaignName}` : ""}.`;

  await notifications().save(
    notifications().create({ kind: "conversion", title, detail, leadId: lead.id, campaignId: lead.campaignId }),
  );
  void dispatchExternalAlerts("conversion", title, detail);
}

// No Slack/email dispatch here, deliberately — a routine automated follow-up send
// would spam both channels every 3/7 days per lead. In-app only.
export async function notifyFollowUp(lead: Lead, stage: "day3" | "day7"): Promise<void> {
  const dayLabel = stage === "day3" ? "Day 3" : "Day 7";
  const title = `${dayLabel} follow-up sent`;
  const detail = `${dayLabel} follow-up sent to ${lead.contactName} at ${lead.company}${lead.campaignName ? ` (${lead.campaignName})` : ""}.`;

  await notifications().save(
    notifications().create({ kind: "follow_up", title, detail, leadId: lead.id, campaignId: lead.campaignId }),
  );
}
