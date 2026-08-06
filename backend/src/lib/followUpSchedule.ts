import { env } from "./env.js";

const DAY_MS = 86_400_000;

// Debug mode compresses the multi-day follow-up cadence into seconds so the full
// sequence is watchable within a dev session, without changing the send/skip logic.
export const FOLLOWUP_DELAYS_MS: Record<"day3" | "day7", number> = env.debug
  ? { day3: 15_000, day7: 30_000 }
  : { day3: 3 * DAY_MS, day7: 7 * DAY_MS };
