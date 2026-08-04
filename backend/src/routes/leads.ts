import { Router } from "express";
import multer from "multer";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { enrichLead } from "../services/enrichmentService.js";
import { importCsvRows, previewCsv } from "../services/leadImportService.js";
import { getImportJob, startLeadSearch } from "../services/leadSearchService.js";
import { setLeadStatus } from "../services/leadStatusService.js";
import { LEAD_STATUSES } from "../types/lead.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

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
