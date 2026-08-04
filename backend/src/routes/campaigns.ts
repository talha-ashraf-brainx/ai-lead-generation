import { Router } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { createCampaign, getCampaign, getCampaignLeads, listCampaigns, setCampaignStatus } from "../services/campaignService.js";
import { CAMPAIGN_STATUSES } from "../types/campaign.js";

export const campaignsRouter = Router();
campaignsRouter.use(requireAuth);

campaignsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listCampaigns());
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post("/", async (req, res, next) => {
  try {
    const { name, leadIds, schedule, scheduledAt, followUps } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) throw new ApiError(400, "Campaign name is required");
    if (!Array.isArray(leadIds) || leadIds.length === 0) throw new ApiError(400, "Select at least one lead");
    if (schedule !== "immediate" && schedule !== "scheduled") {
      throw new ApiError(400, "schedule must be 'immediate' or 'scheduled'");
    }
    if (!followUps?.day3 || !followUps?.day7) {
      throw new ApiError(400, "Follow-up configuration for day3 and day7 is required");
    }

    const campaign = await createCampaign({
      name: name.trim(),
      leadIds,
      schedule,
      scheduledAt: scheduledAt ?? null,
      followUps,
    });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await getCampaign(req.params.id));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get("/:id/leads", async (req, res, next) => {
  try {
    await getCampaign(req.params.id);
    res.json(await getCampaignLeads(req.params.id));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!CAMPAIGN_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${CAMPAIGN_STATUSES.join(", ")}`);
    }

    res.json(await setCampaignStatus(req.params.id, status));
  } catch (err) {
    next(err);
  }
});
