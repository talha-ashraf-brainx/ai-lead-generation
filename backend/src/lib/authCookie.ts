import type { Response } from "express";
import { env } from "./env.js";

export const AUTH_COOKIE_NAME = "emberline_session";

// Real token expiry is enforced by the JWT itself; the cookie's maxAge just
// bounds how long a stale, unverified cookie can sit in the browser.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME);
}
