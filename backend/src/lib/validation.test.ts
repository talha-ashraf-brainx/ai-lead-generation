import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validation.js";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("owner@emberline.dev")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co.uk")).toBe(true);
  });

  it("tolerates surrounding whitespace", () => {
    expect(isValidEmail("  owner@emberline.dev  ")).toBe(true);
  });

  it("rejects addresses with no @ or no dotted domain", () => {
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
  });

  it("rejects empty, whitespace-only, and internally spaced values", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("two words@example.com")).toBe(false);
  });

  it("rejects a bare domain or a missing local part", () => {
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("example.com")).toBe(false);
  });
});
