import { describe, expect, it } from "vitest";
import { resolveSendRecipient } from "./debugRecipient.js";

const LEAD = "lead@realcompany.com";
const SINK = "delivered@resend.dev";

describe("resolveSendRecipient", () => {
  it("redirects to the safe address in debug mode, keeping the intended recipient", () => {
    expect(resolveSendRecipient(LEAD, { debug: true, redirectTo: SINK })).toEqual({
      to: SINK,
      redirectedFrom: LEAD,
    });
  });

  it("never redirects outside debug mode", () => {
    expect(resolveSendRecipient(LEAD, { debug: false, redirectTo: SINK })).toEqual({
      to: LEAD,
      redirectedFrom: null,
    });
  });

  it("falls back to the real recipient when no redirect address is configured", () => {
    expect(resolveSendRecipient(LEAD, { debug: true, redirectTo: "" })).toEqual({
      to: LEAD,
      redirectedFrom: null,
    });
  });
});
