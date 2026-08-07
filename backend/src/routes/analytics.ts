import { Router } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getAnalyticsOverview, getAnalyticsSeries, getCampaignBreakdown } from "../services/analyticsService.js";
import type { AnalyticsDateRange } from "../types/analytics.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

function parseDateRange(query: Record<string, unknown>): AnalyticsDateRange {
  const { dateFrom, dateTo } = query;
  if (dateFrom !== undefined && (typeof dateFrom !== "string" || Number.isNaN(Date.parse(dateFrom)))) {
    throw new ApiError(400, "dateFrom must be a valid date");
  }
  if (dateTo !== undefined && (typeof dateTo !== "string" || Number.isNaN(Date.parse(dateTo)))) {
    throw new ApiError(400, "dateTo must be a valid date");
  }

  return { dateFrom: dateFrom as string | undefined, dateTo: dateTo as string | undefined };
}

analyticsRouter.get("/overview", async (req, res, next) => {
  try {
    res.json(await getAnalyticsOverview(parseDateRange(req.query), req.user!.id));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/series", async (req, res, next) => {
  try {
    res.json(await getAnalyticsSeries(parseDateRange(req.query), req.user!.id));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/campaigns", async (req, res, next) => {
  try {
    res.json(await getCampaignBreakdown(parseDateRange(req.query), req.user!.id));
  } catch (err) {
    next(err);
  }
});
