import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME } from "../lib/authCookie.js";
import { verifyAuthToken } from "../lib/jwt.js";
import { ApiError } from "./errorHandler.js";

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice("Bearer ".length);

  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired session"));
  }
}
