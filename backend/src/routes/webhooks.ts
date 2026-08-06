import express, { Router } from "express";
import { Webhook } from "svix";
import { env } from "../lib/env.js";
import { extractCampaignSendId } from "../lib/inboundReply.js";
import { logger } from "../lib/logger.js";
import { recordReply, recordResendEvent, type ResendWebhookEvent } from "../services/campaignSendTrackingService.js";

export const webhooksRouter = Router();

function svixHeaders(req: express.Request): Record<string, string> {
  return {
    "svix-id": req.get("svix-id") ?? "",
    "svix-timestamp": req.get("svix-timestamp") ?? "",
    "svix-signature": req.get("svix-signature") ?? "",
  };
}

// Needs the raw request body to verify Resend's Svix signature, so these routes use
// express.raw() instead of the app-wide express.json() (mounted before them in app.ts).
webhooksRouter.post("/resend", express.raw({ type: "*/*" }), async (req, res) => {
  const payload = req.body as Buffer;
  let event: ResendWebhookEvent;

  if (env.resendWebhookSecret) {
    try {
      event = new Webhook(env.resendWebhookSecret).verify(payload, svixHeaders(req)) as ResendWebhookEvent;
    } catch {
      res.status(401).json({ error: { message: "Invalid Resend signature" } });
      return;
    }
  } else {
    logger.warn("Resend webhook received without signature verification (RESEND_WEBHOOK_SECRET not set)");
    try {
      event = JSON.parse(payload.toString("utf-8"));
    } catch {
      res.status(400).json({ error: { message: "Invalid JSON payload" } });
      return;
    }
  }

  await recordResendEvent(event);
  res.status(200).json({ received: true });
});

// Resend inbound email — https://resend.com/docs/dashboard/receiving/introduction.
// The `email.received` webhook only carries metadata (from/to/subject/etc), which is all
// we need here: `recordReply` just flips the lead's status, it doesn't read the body.
webhooksRouter.post("/resend-inbound", express.raw({ type: "*/*" }), async (req, res) => {
  const payload = req.body as Buffer;
  let event: ResendWebhookEvent;

  if (env.resendInboundWebhookSecret) {
    try {
      event = new Webhook(env.resendInboundWebhookSecret).verify(payload, svixHeaders(req)) as ResendWebhookEvent;
    } catch {
      res.status(401).json({ error: { message: "Invalid Resend signature" } });
      return;
    }
  } else {
    logger.warn("Resend inbound webhook received without signature verification (RESEND_INBOUND_WEBHOOK_SECRET not set)");
    try {
      event = JSON.parse(payload.toString("utf-8"));
    } catch {
      res.status(400).json({ error: { message: "Invalid JSON payload" } });
      return;
    }
  }

  if (event.type !== "email.received") {
    res.status(200).json({ received: true });
    return;
  }

  const to = event.data?.to;
  const toField = Array.isArray(to) ? to.join(",") : typeof to === "string" ? to : "";
  const campaignSendId = extractCampaignSendId(toField);

  if (campaignSendId) {
    await recordReply(campaignSendId).catch((err) => {
      logger.error("Failed to record inbound reply", { campaignSendId, error: err instanceof Error ? err.message : err });
    });
  } else {
    logger.warn("Resend inbound webhook: no campaignSendId found in 'to' field", { to });
  }

  res.status(200).json({ received: true });
});
