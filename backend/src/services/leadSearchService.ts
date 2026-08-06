import { searchPeopleWithApollo } from "../lib/apolloClient.js";
import { Lead } from "../entities/Lead.js";
import { LeadImportJob } from "../entities/LeadImportJob.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { generateSeedLeads } from "../lib/seedLeadGenerator.js";
import { ApiError } from "../middleware/errorHandler.js";
import { enqueueEnrichment } from "./enrichmentService.js";

// Common shape between seed-mode's fabricated leads (which come with a fake email
// already) and real Apollo discovery results (which never include an email — that's
// only revealed later, per-lead, by the enrichment step).
interface DiscoveredLead {
  company: string;
  contactName: string;
  email: string | null;
  website: string;
  industry: string;
  painPoint: string | null;
}

async function discoverLeads(niche: string, location: string): Promise<DiscoveredLead[]> {
  if (env.seedMode) {
    // Simulates provider latency so the "non-blocking" UX actually has something to wait for.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return generateSeedLeads(niche, location);
  }

  const people = await searchPeopleWithApollo(niche, location);
  return people.map((person) => ({
    company: person.company,
    contactName: person.contactName,
    email: null,
    website: person.website,
    industry: person.industry,
    painPoint: null,
  }));
}

function jobs() {
  return AppDataSource.getRepository(LeadImportJob);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

export async function startLeadSearch(niche: string, location: string): Promise<LeadImportJob> {
  const job = await jobs().save(jobs().create({ niche, location, status: "processing" }));

  // Fire-and-forget: the caller polls getImportJob() for progress (FR-LEAD-IN-5).
  // No queue yet (BullMQ lands in Phase 5) — a single in-process run is enough for one job at a time.
  void runSearchJob(job.id, niche, location);

  return job;
}

export async function getImportJob(id: string): Promise<LeadImportJob> {
  const job = await jobs().findOne({ where: { id } });
  if (!job) throw new ApiError(404, "Import job not found");
  return job;
}

async function runSearchJob(jobId: string, niche: string, location: string): Promise<void> {
  try {
    const generated = await discoverLeads(niche, location);

    const emailCandidates = [...new Set(generated.filter((lead) => lead.email).map((lead) => lead.email!.toLowerCase()))];
    const companyCandidates = [...new Set(generated.map((lead) => lead.company.toLowerCase()))];
    const existing = await leads()
      .createQueryBuilder("lead")
      .where("LOWER(lead.email) IN (:...emails)", { emails: emailCandidates.length ? emailCandidates : [""] })
      .orWhere("LOWER(lead.company) IN (:...companies)", { companies: companyCandidates.length ? companyCandidates : [""] })
      .getMany();
    const existingEmails = new Set(existing.map((lead) => lead.email?.toLowerCase()).filter(Boolean));
    // Real discovery results have no email yet (only revealed later, by enrichment), so
    // they're deduped against already-sourced leads by company+contact instead.
    const existingPairs = new Set(existing.map((lead) => `${lead.company.toLowerCase()}::${lead.contactName.toLowerCase()}`));

    const newLeads: Lead[] = [];
    let duplicateCount = 0;

    for (const generatedLead of generated) {
      const pairKey = `${generatedLead.company.toLowerCase()}::${generatedLead.contactName.toLowerCase()}`;
      const isDuplicate = generatedLead.email
        ? existingEmails.has(generatedLead.email.toLowerCase())
        : existingPairs.has(pairKey);
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }
      if (generatedLead.email) existingEmails.add(generatedLead.email.toLowerCase());
      existingPairs.add(pairKey);

      newLeads.push(
        leads().create({
          company: generatedLead.company,
          contactName: generatedLead.contactName,
          email: generatedLead.email,
          website: generatedLead.website,
          industry: generatedLead.industry,
          status: "new",
          enrichment: "pending",
          campaignId: null,
          campaignName: null,
          painPoint: generatedLead.painPoint,
          source: "search",
        }),
      );
    }

    if (newLeads.length) {
      await leads().save(newLeads);
      // FR handoff to Phase 3: each newly-sourced lead starts "pending" and gets
      // enriched in the background so the leads table's status column updates in place.
      newLeads.forEach((lead) => enqueueEnrichment(lead.id));
    }

    await jobs().update(jobId, {
      status: "completed",
      importedCount: newLeads.length,
      duplicateCount,
      errorCount: 0,
      completedAt: new Date(),
    });
  } catch (err) {
    logger.error("Lead search job failed", { jobId, error: err instanceof Error ? err.message : err });
    await jobs().update(jobId, {
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      completedAt: new Date(),
    });
  }
}
