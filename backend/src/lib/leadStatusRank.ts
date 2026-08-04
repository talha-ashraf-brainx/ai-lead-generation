import { LEAD_STATUSES, type LeadStatus } from "../types/lead.js";

const RANK = new Map(LEAD_STATUSES.map((status, index) => [status, index]));

// Enforces the funnel's forward-only ordering (contacted → opened → replied →
// converted) for automatic transitions — used by both open tracking (Phase 5) and
// reply detection (Phase 6) so neither can downgrade a lead that's already moved
// further along (e.g. a late "open" webhook after the lead already replied).
export function isForwardLeadStatus(current: LeadStatus, next: LeadStatus): boolean {
  return (RANK.get(next) ?? -1) > (RANK.get(current) ?? -1);
}
