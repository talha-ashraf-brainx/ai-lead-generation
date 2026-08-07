import { Router } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { enqueueBulkGeneration, generateEmailDraft, getEmailDraft, saveEmailDraft } from "../services/emailGenerationService.js";

export const emailDraftsRouter = Router();
emailDraftsRouter.use(requireAuth);

emailDraftsRouter.post("/bulk-generate", (req, res, next) => {
  try {
    const { leadIds } = req.body ?? {};
    if (!Array.isArray(leadIds) || leadIds.length === 0) throw new ApiError(400, "leadIds must be a non-empty array");

    res.status(202).json(enqueueBulkGeneration(leadIds, req.user!.id));
  } catch (err) {
    next(err);
  }
});

emailDraftsRouter.get("/:leadId", async (req, res, next) => {
  try {
    const draft = await getEmailDraft(req.params.leadId, req.user!.id);
    if (!draft) throw new ApiError(404, "No draft for this lead yet");
    res.json(draft);
  } catch (err) {
    next(err);
  }
});

emailDraftsRouter.post("/:leadId/generate", async (req, res, next) => {
  try {
    res.json(await generateEmailDraft(req.params.leadId, req.user!.id));
  } catch (err) {
    next(err);
  }
});

emailDraftsRouter.patch("/:leadId", async (req, res, next) => {
  try {
    const { subject, body, status } = req.body ?? {};
    if (typeof subject !== "string" || typeof body !== "string") {
      throw new ApiError(400, "subject and body are required");
    }
    if (status !== "edited" && status !== "approved") {
      throw new ApiError(400, "status must be 'edited' or 'approved'");
    }

    res.json(await saveEmailDraft(req.params.leadId, { subject, body }, status, req.user!.id));
  } catch (err) {
    next(err);
  }
});
