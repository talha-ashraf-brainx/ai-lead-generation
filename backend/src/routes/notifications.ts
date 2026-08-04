import { Router } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  clearNotifications,
  getNotificationSettings,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationSettings,
  testSlackWebhook,
} from "../services/notificationService.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listNotifications());
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/read-all", async (_req, res, next) => {
  try {
    await markAllNotificationsRead();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/:id/read", async (req, res, next) => {
  try {
    res.json(await markNotificationRead(req.params.id));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.delete("/", async (_req, res, next) => {
  try {
    await clearNotifications();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

notificationsRouter.get("/settings", async (_req, res, next) => {
  try {
    res.json(await getNotificationSettings());
  } catch (err) {
    next(err);
  }
});

notificationsRouter.put("/settings", async (req, res, next) => {
  try {
    const { slackEnabled, slackWebhookUrl, emailAlertsEnabled } = req.body ?? {};
    if (typeof slackEnabled !== "boolean" || typeof emailAlertsEnabled !== "boolean") {
      throw new ApiError(400, "slackEnabled and emailAlertsEnabled must be booleans");
    }

    res.json(await saveNotificationSettings({ slackEnabled, slackWebhookUrl: slackWebhookUrl ?? "", emailAlertsEnabled }));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/settings/test-slack", async (req, res, next) => {
  try {
    const { webhookUrl } = req.body ?? {};
    if (typeof webhookUrl !== "string") throw new ApiError(400, "webhookUrl is required");

    res.json(await testSlackWebhook(webhookUrl));
  } catch (err) {
    next(err);
  }
});
