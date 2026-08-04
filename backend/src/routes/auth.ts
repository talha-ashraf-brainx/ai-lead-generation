import { Router } from "express";
import { clearAuthCookie, setAuthCookie } from "../lib/authCookie.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { confirmPasswordReset, getUserById, login, requestPasswordReset } from "../services/authService.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const { token, user } = await login(email, password);
    setAuthCookie(res, token);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/password-reset/request", async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string" || !email) {
      throw new ApiError(400, "A valid email address is required");
    }

    const result = await requestPasswordReset(email);
    res.json({ message: "If that email is registered, a reset link has been sent.", ...result });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/password-reset/confirm", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body ?? {};
    if (typeof token !== "string" || !token || typeof newPassword !== "string" || newPassword.length < 8) {
      throw new ApiError(400, "A valid token and a password of at least 8 characters are required");
    }

    await confirmPasswordReset(token, newPassword);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
