import { env } from "./env.js";

const timestamp = () => new Date().toISOString();

export interface DebugLogEntry {
  id: number;
  timestamp: string;
  level: "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
}

const MAX_DEBUG_LOG_ENTRIES = 200;
const debugLog: DebugLogEntry[] = [];
let nextDebugLogId = 1;

// Backs the in-app Debug panel (Topbar > Debug, debug mode only) — a lightweight
// alternative to tailing the server console for rate-limit hits and provider failures.
function recordDebugEntry(level: DebugLogEntry["level"], message: string, meta?: Record<string, unknown>): void {
  if (!env.debug) return;
  debugLog.push({ id: nextDebugLogId++, timestamp: timestamp(), level, message, meta });
  if (debugLog.length > MAX_DEBUG_LOG_ENTRIES) debugLog.shift();
}

export function getDebugLog(): DebugLogEntry[] {
  return debugLog;
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    console.log(`[${timestamp()}] INFO  ${message}`, meta ?? ""),
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[${timestamp()}] WARN  ${message}`, meta ?? "");
    recordDebugEntry("warn", message, meta);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[${timestamp()}] ERROR ${message}`, meta ?? "");
    recordDebugEntry("error", message, meta);
  },
};
