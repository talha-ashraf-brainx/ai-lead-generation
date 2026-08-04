import { Router } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  deleteAllData,
  disconnectApiKey,
  getProfile,
  getSenderIdentity,
  listApiKeyStatuses,
  saveApiKey,
  saveProfile,
  saveSenderIdentity,
} from "../services/settingsService.js";
import { API_KEY_PROVIDERS, type ApiKeyProvider } from "../types/settings.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

function parseProvider(value: string): ApiKeyProvider {
  if (!(API_KEY_PROVIDERS as readonly string[]).includes(value)) {
    throw new ApiError(400, `provider must be one of: ${API_KEY_PROVIDERS.join(", ")}`);
  }
  return value as ApiKeyProvider;
}

settingsRouter.get("/api-keys", async (_req, res, next) => {
  try {
    res.json(await listApiKeyStatuses());
  } catch (err) {
    next(err);
  }
});

settingsRouter.put("/api-keys/:provider", async (req, res, next) => {
  try {
    const provider = parseProvider(req.params.provider);
    const { value } = req.body ?? {};
    if (typeof value !== "string" || !value.trim()) throw new ApiError(400, "value is required");

    res.json(await saveApiKey(provider, value.trim()));
  } catch (err) {
    next(err);
  }
});

settingsRouter.delete("/api-keys/:provider", async (req, res, next) => {
  try {
    await disconnectApiKey(parseProvider(req.params.provider));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

settingsRouter.get("/sender-identity", async (_req, res, next) => {
  try {
    res.json(await getSenderIdentity());
  } catch (err) {
    next(err);
  }
});

settingsRouter.put("/sender-identity", async (req, res, next) => {
  try {
    const { fromName, fromEmail, smtpFallbackEnabled, smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body ?? {};
    if (typeof fromName !== "string" || !fromName.trim()) throw new ApiError(400, "fromName is required");
    if (typeof fromEmail !== "string" || !fromEmail.trim()) throw new ApiError(400, "fromEmail is required");
    if (typeof smtpFallbackEnabled !== "boolean") throw new ApiError(400, "smtpFallbackEnabled must be a boolean");

    res.json(
      await saveSenderIdentity({
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        smtpFallbackEnabled,
        smtpHost: typeof smtpHost === "string" ? smtpHost : "",
        smtpPort: typeof smtpPort === "string" ? smtpPort : "",
        smtpUsername: typeof smtpUsername === "string" ? smtpUsername : "",
        smtpPassword: typeof smtpPassword === "string" ? smtpPassword : "",
      }),
    );
  } catch (err) {
    next(err);
  }
});

settingsRouter.get("/profile", async (req, res, next) => {
  try {
    res.json(await getProfile(req.user!.id));
  } catch (err) {
    next(err);
  }
});

settingsRouter.put("/profile", async (req, res, next) => {
  try {
    const { name, email } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) throw new ApiError(400, "name is required");
    if (typeof email !== "string" || !email.trim()) throw new ApiError(400, "email is required");

    res.json(await saveProfile(req.user!.id, { name: name.trim(), email: email.trim() }));
  } catch (err) {
    next(err);
  }
});

settingsRouter.delete("/data", async (_req, res, next) => {
  try {
    await deleteAllData();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
