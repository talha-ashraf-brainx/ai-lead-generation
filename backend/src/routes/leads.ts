import { Router } from "express";
import multer from "multer";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { enrichLead } from "../services/enrichmentService.js";
import { importCsvRows, previewCsv } from "../services/leadImportService.js";
import {
  bulkAddLeadsToCampaign,
  bulkDeleteLeads,
  getLead,
  listIndustries,
  listLeads,
} from "../services/leadListService.js";
import { getImportJob, startLeadSearch } from "../services/leadSearchService.js";
import { setLeadStatus } from "../services/leadStatusService.js";
import { LEAD_STATUSES, type LeadStatus } from "../types/lead.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

function parseQueryDate(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ApiError(400, `${field} must be a valid date`);
  }
  return value;
}

leadsRouter.get("/", async (req, res, next) => {
  try {
    const { page, pageSize, search, status, industry, campaignId, createdAfter, createdBefore } = req.query;

    const parsedPage = page !== undefined ? Number(page) : 1;
    const parsedPageSize = pageSize !== undefined ? Number(pageSize) : 20;
    if (!Number.isInteger(parsedPage) || parsedPage < 1) throw new ApiError(400, "page must be a positive integer");
    if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1) throw new ApiError(400, "pageSize must be a positive integer");

    if (status !== undefined && status !== "all" && !(LEAD_STATUSES as readonly string[]).includes(status as string)) {
      throw new ApiError(400, `status must be one of: all, ${LEAD_STATUSES.join(", ")}`);
    }

    res.json(
      await listLeads({
        page: parsedPage,
        pageSize: parsedPageSize,
        search: typeof search === "string" ? search : undefined,
        status: status as LeadStatus | "all" | undefined,
        industry: typeof industry === "string" ? industry : undefined,
        campaignId: typeof campaignId === "string" ? campaignId : undefined,
        createdAfter: parseQueryDate(createdAfter, "createdAfter"),
        createdBefore: parseQueryDate(createdBefore, "createdBefore"),
      }),
    );
  } catch (err) {
    next(err);
  }
});

leadsRouter.get("/industries", async (_req, res, next) => {
  try {
    res.json(await listIndustries());
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/bulk-delete", async (req, res, next) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "ids must be a non-empty array");

    await bulkDeleteLeads(ids);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/bulk-add-to-campaign", async (req, res, next) => {
  try {
    const { ids, campaignId } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "ids must be a non-empty array");
    if (typeof campaignId !== "string" || !campaignId) throw new ApiError(400, "campaignId is required");

    res.json(await bulkAddLeadsToCampaign(ids, campaignId));
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/csv/preview", upload.single("file"), (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new ApiError(400, "A CSV file is required");
    if (!file.originalname.toLowerCase().endsWith(".csv") && file.mimetype !== "text/csv") {
      throw new ApiError(400, "File must be a CSV");
    }

    const preview = previewCsv(file.buffer.toString("utf-8"));
    res.json(preview);
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/csv/import", async (req, res, next) => {
  try {
    const { rows } = req.body ?? {};
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new ApiError(400, "No rows to import");
    }

    const summary = await importCsvRows(rows);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/search", async (req, res, next) => {
  try {
    const { niche, location } = req.body ?? {};
    if (typeof niche !== "string" || !niche.trim() || typeof location !== "string" || !location.trim()) {
      throw new ApiError(400, "A niche/keyword and a location are both required");
    }

    const job = await startLeadSearch(niche.trim(), location.trim());
    res.status(202).json({ jobId: job.id, status: job.status });
  } catch (err) {
    next(err);
  }
});

leadsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await getLead(req.params.id));
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/:id/enrich", async (req, res, next) => {
  try {
    const lead = await enrichLead(req.params.id);
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

leadsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!LEAD_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${LEAD_STATUSES.join(", ")}`);
    }

    res.json(await setLeadStatus(req.params.id, status));
  } catch (err) {
    next(err);
  }
});

leadsRouter.get("/import-jobs/:id", async (req, res, next) => {
  try {
    const job = await getImportJob(req.params.id);
    res.json({
      id: job.id,
      niche: job.niche,
      location: job.location,
      status: job.status,
      importedCount: job.importedCount,
      duplicateCount: job.duplicateCount,
      errorCount: job.errorCount,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (err) {
    next(err);
  }
});
