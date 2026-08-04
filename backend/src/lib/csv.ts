import Papa from "papaparse";

export interface CsvPreviewRow {
  rowNumber: number;
  company: string;
  contactName: string;
  email: string;
  website: string;
  isValid: boolean;
  issues: string[];
}

export interface CsvPreview {
  headers: string[];
  missingColumns: string[];
  rows: CsvPreviewRow[];
}

const COLUMN_ALIASES: Record<"company" | "contactName" | "email" | "website", string[]> = {
  company: ["company", "company name", "business", "business name"],
  contactName: ["contact", "contact name", "name", "full name"],
  email: ["email", "email address"],
  website: ["website", "url", "site", "domain"],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function findColumn(headers: string[], key: keyof typeof COLUMN_ALIASES): number {
  const aliases = COLUMN_ALIASES[key];
  return headers.findIndex((header) => aliases.includes(header.trim().toLowerCase()));
}

export function parseLeadsCsv(text: string): CsvPreview {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const lines = parsed.data;

  if (lines.length === 0) {
    return { headers: [], missingColumns: Object.keys(COLUMN_ALIASES), rows: [] };
  }

  const headers = lines[0].map((h) => h.trim());
  const companyIdx = findColumn(headers, "company");
  const contactIdx = findColumn(headers, "contactName");
  const emailIdx = findColumn(headers, "email");
  const websiteIdx = findColumn(headers, "website");

  const missingColumns: string[] = [];
  if (companyIdx === -1) missingColumns.push("company");
  if (emailIdx === -1) missingColumns.push("email");

  const rows: CsvPreviewRow[] = lines.slice(1).map((cells, index) => {
    const company = companyIdx >= 0 ? (cells[companyIdx] ?? "").trim() : "";
    const contactName = contactIdx >= 0 ? (cells[contactIdx] ?? "").trim() : "";
    const email = emailIdx >= 0 ? (cells[emailIdx] ?? "").trim() : "";
    const website = websiteIdx >= 0 ? (cells[websiteIdx] ?? "").trim() : "";

    const issues: string[] = [];
    if (!company) issues.push("Missing company name");
    if (!email) issues.push("Missing email");
    else if (!EMAIL_PATTERN.test(email)) issues.push("Malformed email");

    return {
      rowNumber: index + 2,
      company,
      contactName,
      email,
      website,
      isValid: issues.length === 0,
      issues,
    };
  });

  return { headers, missingColumns, rows };
}
