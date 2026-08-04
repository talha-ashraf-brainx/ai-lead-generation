import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Not found: ${req.method} ${req.path}` } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  if (status >= 500) {
    logger.error(message, { path: req.path, method: req.method, stack: err instanceof Error ? err.stack : undefined });
  }

  res.status(status).json({ error: { message } });
}
