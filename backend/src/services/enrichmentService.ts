import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { enrichWithApollo, type EnrichmentResult } from "../lib/apolloClient.js";
import { env } from "../lib/env.js";
import { enrichWithHunter } from "../lib/hunterClient.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

// Mirrors the frontend mock's scheduleEnrichment() 90% success rate, so the seed-mode
// demo flow looks the same as it will once real providers are wired up.
const SEED_ENRICHMENT_SUCCESS_RATE = 0.9;

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
  if (env.seedMode) {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));
    if (Math.random() >= SEED_ENRICHMENT_SUCCESS_RATE) {
      throw new Error("Seed enrichment provider simulated a lookup failure");
    }
    return {
      contactName: lead.contactName,
      email: lead.email ?? `${lead.contactName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      website: lead.website,
    };
  }

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

export async function enrichLead(leadId: string): Promise<Lead> {
  const repo = leads();
  const lead = await repo.findOne({ where: { id: leadId } });
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
export function enqueueEnrichment(leadId: string): void {
  void enrichLead(leadId).catch((err) => {
    logger.error("Unhandled enrichment job error", { leadId, error: err instanceof Error ? err.message : err });
  });
}
