import { Lead } from "../entities/Lead.js";
import { LeadImportJob } from "../entities/LeadImportJob.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { generateSeedLeads } from "../lib/seedLeadGenerator.js";
import { ApiError } from "../middleware/errorHandler.js";
import { enqueueEnrichment } from "./enrichmentService.js";

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
    if (!env.seedMode) {
      // Real discovery-by-niche (Apollo/Hunter organization search) isn't built — only
      // per-lead enrichment (Phase 3) talks to live providers. Until discovery lands,
      // only seed mode works here.
      throw new Error("Lead sourcing provider is not configured (SEED_MODE=false, and no live provider yet)");
    }

    // Simulates provider latency so the "non-blocking" UX actually has something to wait for.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const generated = generateSeedLeads(niche, location);
    const candidateEmails = generated.map((lead) => lead.email.toLowerCase());
    const existing = await leads()
      .createQueryBuilder("lead")
      .where("LOWER(lead.email) IN (:...emails)", { emails: candidateEmails })
      .getMany();
    const existingEmails = new Set(existing.map((lead) => lead.email?.toLowerCase()).filter(Boolean));

    const newLeads: Lead[] = [];
    let duplicateCount = 0;

    for (const generatedLead of generated) {
      const emailLower = generatedLead.email.toLowerCase();
      if (existingEmails.has(emailLower)) {
        duplicateCount++;
        continue;
      }
      existingEmails.add(emailLower);
      newLeads.push(
        leads().create({
          company: generatedLead.company,
          contactName: generatedLead.contactName,
          email: generatedLead.email,
          website: generatedLead.website,
          industry: generatedLead.industry,
          status: "contacted",
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
