import { describe, expect, it } from "vitest";
import { findTag } from "./campaignSendTrackingService.js";

describe("findTag", () => {
  it("finds a value in an array of {name, value} tags", () => {
    expect(findTag([{ name: "campaignSendId", value: "abc-123" }], "campaignSendId")).toBe("abc-123");
  });

  it("finds a value in a plain object map of tags", () => {
    expect(findTag({ campaignSendId: "abc-123" }, "campaignSendId")).toBe("abc-123");
  });

  it("returns null when the tag is missing", () => {
    expect(findTag([{ name: "other", value: "x" }], "campaignSendId")).toBeNull();
  });

  it("returns null for non-string values", () => {
    expect(findTag({ campaignSendId: 123 }, "campaignSendId")).toBeNull();
  });

  it("returns null for undefined/null tags", () => {
    expect(findTag(undefined, "campaignSendId")).toBeNull();
    expect(findTag(null, "campaignSendId")).toBeNull();
  });
});
