import { describe, expect, it } from "vitest";
import { firstName, renderTemplate } from "./textUtils.js";

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Ethan Okafor")).toBe("Ethan");
  });

  it("returns the whole string when there's no space", () => {
    expect(firstName("Cher")).toBe("Cher");
  });
});

describe("renderTemplate", () => {
  const lead = { contactName: "Ethan Okafor", company: "Acme Dental" };

  it("substitutes both merge tags", () => {
    expect(renderTemplate("Hi {{firstName}}, re: {{company}}", lead)).toBe("Hi Ethan, re: Acme Dental");
  });

  it("substitutes repeated occurrences", () => {
    expect(renderTemplate("{{company}} — {{company}}", lead)).toBe("Acme Dental — Acme Dental");
  });

  it("leaves the template untouched when there are no tags", () => {
    expect(renderTemplate("No tags here", lead)).toBe("No tags here");
  });
});
