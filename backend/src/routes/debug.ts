import { Router } from "express";
import { env } from "../lib/env.js";
import { getDebugLog } from "../lib/logger.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const debugRouter = Router();
debugRouter.use(requireAuth);

debugRouter.get("/status", (_req, res) => {
  res.json({ enabled: env.debug });
});

debugRouter.get("/log", (_req, res) => {
  res.json(getDebugLog());
});
