import { describe, expect, it } from "vitest";
import { buildReplyToAddress, extractCampaignSendId } from "./inboundReply.js";

const ID = "af9c01d5-a279-4d2f-aaad-c126e1422419";

describe("buildReplyToAddress", () => {
  // Guards the fix for outbound sends carrying a Reply-To on a domain that doesn't
  // resolve — with no INBOUND_REPLY_DOMAIN configured there must be no header at all.
  it("returns undefined when no inbound reply domain is configured", () => {
    expect(buildReplyToAddress(ID)).toBeUndefined();
  });
});

describe("extractCampaignSendId", () => {
  it("extracts the id from a bare address", () => {
    expect(extractCampaignSendId(`reply+${ID}@reply.emberline.dev`)).toBe(ID);
  });

  it("extracts the id from a display-name-wrapped address", () => {
    expect(extractCampaignSendId(`"Lead Reply" <reply+${ID}@reply.emberline.dev>`)).toBe(ID);
  });

  it("extracts the id from the first of several comma-separated recipients", () => {
    expect(extractCampaignSendId(`someone-else@example.com, reply+${ID}@reply.emberline.dev`)).toBe(ID);
  });

  it("returns null when no reply address is present", () => {
    expect(extractCampaignSendId("someone@example.com")).toBeNull();
  });

  it("returns null for a malformed id (wrong length)", () => {
    expect(extractCampaignSendId("reply+not-a-uuid@reply.emberline.dev")).toBeNull();
  });
});
