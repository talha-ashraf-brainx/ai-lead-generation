import { env } from "./env.js";

// A per-send reply-to address (reply+<campaignSendId>@<domain>) is set on every real
// outbound send (see emailWorker.ts) so an inbound reply can be matched back to the
// exact lead/campaign/stage without guessing from sender email or subject line.
export function buildReplyToAddress(campaignSendId: string): string {
  return `reply+${campaignSendId}@${env.inboundReplyDomain}`;
}

const REPLY_ADDRESS_PATTERN = /reply\+([0-9a-fA-F-]{36})@/;

// SendGrid Inbound Parse's `to` field can contain multiple comma-separated, display-name-
// wrapped addresses — search the whole string rather than trying to parse it as RFC 5322.
export function extractCampaignSendId(toField: string): string | null {
  const match = REPLY_ADDRESS_PATTERN.exec(toField);
  return match ? match[1] : null;
}
