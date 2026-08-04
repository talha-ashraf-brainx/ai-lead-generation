import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";
import express, { Router } from "express";
import multer from "multer";
import { env } from "../lib/env.js";
import { extractCampaignSendId } from "../lib/inboundReply.js";
import { logger } from "../lib/logger.js";
import { applySendGridEvents, recordReply } from "../services/campaignSendTrackingService.js";

export const webhooksRouter = Router();
const parseInboundFields = multer().none();

// Needs the raw request body to verify SendGrid's ECDSA signature, so this route uses
// express.raw() instead of the app-wide express.json() (mounted before it in app.ts).
webhooksRouter.post("/sendgrid", express.raw({ type: "*/*" }), async (req, res) => {
  const payload = req.body as Buffer;

  if (env.sendgridWebhookVerificationKey) {
    const signature = req.get(EventWebhookHeader.SIGNATURE());
    const timestamp = req.get(EventWebhookHeader.TIMESTAMP());
    if (!signature || !timestamp) {
      res.status(400).json({ error: { message: "Missing SendGrid signature headers" } });
      return;
    }

    const eventWebhook = new EventWebhook();
    const publicKey = eventWebhook.convertPublicKeyToECDSA(env.sendgridWebhookVerificationKey);
    if (!eventWebhook.verifySignature(publicKey, payload, signature, timestamp)) {
      res.status(401).json({ error: { message: "Invalid SendGrid signature" } });
      return;
    }
  } else {
    logger.warn("SendGrid webhook received without signature verification (SENDGRID_WEBHOOK_VERIFICATION_KEY not set)");
  }

  let events: unknown;
  try {
    events = JSON.parse(payload.toString("utf-8"));
  } catch {
    res.status(400).json({ error: { message: "Invalid JSON payload" } });
    return;
  }

  if (!Array.isArray(events)) {
    res.status(400).json({ error: { message: "Expected an array of events" } });
    return;
  }

  await applySendGridEvents(events);
  res.status(200).json({ received: events.length });
});

// SendGrid Inbound Parse — https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook.
// No signing support like the Event Webhook above, so this route is protected by a
// shared-secret query param instead (the SendGrid destination URL is configured with
// it baked in, e.g. .../sendgrid-inbound?token=...).
webhooksRouter.post("/sendgrid-inbound", parseInboundFields, async (req, res) => {
  if (env.inboundParseSecret) {
    if (req.query.token !== env.inboundParseSecret) {
      res.status(401).json({ error: { message: "Invalid inbound parse token" } });
      return;
    }
  } else {
    logger.warn("SendGrid inbound parse webhook received without a configured INBOUND_PARSE_SECRET");
  }

  const to = typeof req.body?.to === "string" ? req.body.to : "";
  const campaignSendId = extractCampaignSendId(to);

  if (campaignSendId) {
    await recordReply(campaignSendId).catch((err) => {
      logger.error("Failed to record inbound reply", { campaignSendId, error: err instanceof Error ? err.message : err });
    });
  } else {
    logger.warn("SendGrid inbound parse webhook: no campaignSendId found in 'to' field", { to });
  }

  res.status(200).json({ received: true });
});
