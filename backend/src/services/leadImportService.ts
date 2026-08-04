import { type CsvPreview, type CsvPreviewRow, parseLeadsCsv } from "../lib/csv.js";
import { AppDataSource } from "../lib/dataSource.js";
import { Lead } from "../entities/Lead.js";

export interface ImportSummary {
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  errorDetails: { row: number; reason: string }[];
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

export function previewCsv(text: string): CsvPreview {
  return parseLeadsCsv(text);
}

export async function importCsvRows(rows: CsvPreviewRow[]): Promise<ImportSummary> {
  const errorDetails = rows.filter((row) => !row.isValid).map((row) => ({ row: row.rowNumber, reason: row.issues.join(", ") }));

  const validRows = rows.filter((row) => row.isValid);
  const candidateEmails = [...new Set(validRows.map((row) => row.email.toLowerCase()))];

  // BR-1: a lead is a duplicate if its email matches an existing lead's, case-insensitively.
  const existing = candidateEmails.length
    ? await leads()
        .createQueryBuilder("lead")
        .where("LOWER(lead.email) IN (:...emails)", { emails: candidateEmails })
        .getMany()
    : [];
  const existingEmails = new Set(existing.map((lead) => lead.email?.toLowerCase()).filter(Boolean));

  const newLeads: Lead[] = [];
  let duplicateCount = 0;

  for (const row of validRows) {
    const emailLower = row.email.toLowerCase();
    if (existingEmails.has(emailLower)) {
      duplicateCount++;
      continue;
    }
    existingEmails.add(emailLower);

    newLeads.push(
      leads().create({
        company: row.company,
        contactName: row.contactName || "Unknown contact",
        email: row.email,
        website: row.website || "",
        industry: "Imported",
        status: "contacted",
        enrichment: "enriched",
        campaignId: null,
        campaignName: null,
        painPoint: null,
        source: "csv",
      }),
    );
  }

  if (newLeads.length) await leads().save(newLeads);

  return {
    importedCount: newLeads.length,
    duplicateCount,
    errorCount: errorDetails.length,
    errorDetails,
  };
}
