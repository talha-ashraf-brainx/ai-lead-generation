export const LEAD_STATUSES = ["new", "contacted", "opened", "replied", "converted"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ENRICHMENT_STATUSES = ["pending", "enriched", "failed"] as const;
export type EnrichmentStatus = (typeof ENRICHMENT_STATUSES)[number];

export const LEAD_SOURCES = ["csv", "search"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const IMPORT_JOB_STATUSES = ["processing", "completed", "failed"] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];
