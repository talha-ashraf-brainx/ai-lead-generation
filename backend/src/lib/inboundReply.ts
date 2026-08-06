import { env } from "./env.js";

// A per-send reply-to address (reply+<campaignSendId>@<domain>) is set on every real
// outbound send (see emailWorker.ts) so an inbound reply can be matched back to the
// exact lead/campaign/stage without guessing from sender email or subject line.
//
// Returns undefined when INBOUND_REPLY_DOMAIN isn't set, so the send goes out with no
// Reply-To at all rather than one pointing at a domain that doesn't resolve — a
// non-existent Reply-To domain gets mail rejected or spam-filed by strict receivers.
// Reply detection stays dark until a real receiving domain is configured (dev-required.md).
export function buildReplyToAddress(campaignSendId: string): string | undefined {
  if (!env.inboundReplyDomain) return undefined;
  return `reply+${campaignSendId}@${env.inboundReplyDomain}`;
}

const REPLY_ADDRESS_PATTERN = /reply\+([0-9a-fA-F-]{36})@/;

// Resend's inbound `to` field can contain multiple comma-separated, display-name-
// wrapped addresses — search the whole string rather than trying to parse it as RFC 5322.
export function extractCampaignSendId(toField: string): string | null {
  const match = REPLY_ADDRESS_PATTERN.exec(toField);
  return match ? match[1] : null;
}
