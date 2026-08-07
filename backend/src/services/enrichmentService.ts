import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { enrichWithApollo, type EnrichmentResult } from "../lib/apolloClient.js";
import { enrichWithHunter } from "../lib/hunterClient.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

// In-process retries for a single job run (no queue until BullMQ lands in Phase 5) —
// covers transient provider errors without failing the lead on the first hiccup.
const TRANSIENT_RETRY_DELAYS_MS = [500, 1500];

function leads() {
  return AppDataSource.getRepository(Lead);
}

function domainFromWebsite(website: string | null): string | undefined {
  if (!website) return undefined;
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

async function enrichOnce(lead: Lead): Promise<EnrichmentResult> {
  const domain = domainFromWebsite(lead.website);

  try {
    return await enrichWithApollo({ company: lead.company, contactName: lead.contactName, domain });
  } catch (apolloErr) {
    logger.warn("Apollo enrichment failed, falling back to Hunter", {
      leadId: lead.id,
      error: apolloErr instanceof Error ? apolloErr.message : apolloErr,
    });
    return await enrichWithHunter({ company: lead.company, contactName: lead.contactName, domain });
  }
}

export async function enrichLead(leadId: string, userId: string): Promise<Lead> {
  const repo = leads();
  const lead = await repo.findOne({ where: { id: leadId, userId } });
  if (!lead) throw new ApiError(404, "Lead not found");

  let lastError: unknown;
  for (let attempt = 0; attempt <= TRANSIENT_RETRY_DELAYS_MS.length; attempt++) {
    lead.enrichmentAttempts += 1;
    try {
      const result = await enrichOnce(lead);
      lead.contactName = result.contactName || lead.contactName;
      lead.email = result.email;
      lead.website = result.website || lead.website;
      lead.enrichment = "enriched";
      lead.enrichmentError = null;
      return await repo.save(lead);
    } catch (err) {
      lastError = err;
      if (attempt < TRANSIENT_RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, TRANSIENT_RETRY_DELAYS_MS[attempt]));
      }
    }
  }

  lead.enrichment = "failed";
  lead.enrichmentError = lastError instanceof Error ? lastError.message : "Unknown enrichment error";
  logger.error("Lead enrichment failed", { leadId, error: lead.enrichmentError });
  return await repo.save(lead);
}

// Fire-and-forget trigger for freshly-created leads — same in-process pattern as
// leadSearchService's search job, no queue needed for a single-user app yet.
export function enqueueEnrichment(leadId: string, userId: string): void {
  void enrichLead(leadId, userId).catch((err) => {
    logger.error("Unhandled enrichment job error", { leadId, error: err instanceof Error ? err.message : err });
  });
}
