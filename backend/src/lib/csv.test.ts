import { describe, expect, it } from "vitest";
import { parseLeadsCsv } from "./csv.js";

describe("parseLeadsCsv", () => {
  it("maps aliased, case-insensitive headers and flags no missing columns", () => {
    const csv = "Business Name,Full Name,Email Address,URL\nAcme Inc,Jane Doe,jane@acme.com,acme.com";
    const result = parseLeadsCsv(csv);

    expect(result.missingColumns).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      company: "Acme Inc",
      contactName: "Jane Doe",
      email: "jane@acme.com",
      website: "acme.com",
      isValid: true,
      issues: [],
    });
  });

  it("reports missing required columns", () => {
    const csv = "Name,Phone\nJane Doe,555-1234";
    const result = parseLeadsCsv(csv);

    expect(result.missingColumns).toEqual(["company", "email"]);
  });

  it("flags a row missing both required fields and a row with a malformed email", () => {
    const csv = ["Company,Email", ",", "Beta LLC,not-an-email"].join("\n");
    const result = parseLeadsCsv(csv);

    expect(result.rows[0]).toMatchObject({ isValid: false, issues: ["Missing company name", "Missing email"] });
    expect(result.rows[1]).toMatchObject({ isValid: false, issues: ["Malformed email"] });
  });

  it("returns no rows for an empty file", () => {
    expect(parseLeadsCsv("")).toEqual({ headers: [], missingColumns: ["company", "contactName", "email", "website"], rows: [] });
  });
});
