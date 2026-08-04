import { describe, expect, it } from "vitest";
import { isForwardLeadStatus } from "./leadStatusRank.js";

describe("isForwardLeadStatus", () => {
  it("allows a forward move", () => {
    expect(isForwardLeadStatus("contacted", "opened")).toBe(true);
    expect(isForwardLeadStatus("opened", "replied")).toBe(true);
    expect(isForwardLeadStatus("contacted", "converted")).toBe(true);
  });

  it("rejects a backward move", () => {
    expect(isForwardLeadStatus("replied", "opened")).toBe(false);
    expect(isForwardLeadStatus("converted", "contacted")).toBe(false);
  });

  it("rejects a no-op move to the same status", () => {
    expect(isForwardLeadStatus("opened", "opened")).toBe(false);
  });
});
