import { env } from "./env.js";
import type { EnrichmentQuery, EnrichmentResult } from "./apolloClient.js";

// Hunter.io — email finding fallback when Apollo can't reveal an email
// (per SRS Section 5 / frontend Settings copy: "Email finding (enrichment fallback)").
export async function enrichWithHunter(query: EnrichmentQuery): Promise<EnrichmentResult> {
  if (!env.hunterApiKey) throw new Error("HUNTER_API_KEY is not configured");

  if (query.domain) {
    const email = await findEmailOnDomain(query);
    if (email) return email;
  }

  throw new Error("Hunter could not find a matching email");
}

async function findEmailOnDomain(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
  const [firstName, ...rest] = (query.contactName ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");

  // Email Finder — https://hunter.io/api-documentation/v2#email-finder — needs a first/last name.
  if (firstName && lastName) {
    const params = new URLSearchParams({
      domain: query.domain!,
      first_name: firstName,
      last_name: lastName,
      api_key: env.hunterApiKey,
    });
    const response = await fetch(`https://api.hunter.io/v2/email-finder?${params.toString()}`);
    if (response.ok) {
      const data = (await response.json()) as { data?: { email?: string | null } };
      if (data.data?.email) {
        return { contactName: query.contactName || "Unknown contact", email: data.data.email, website: `https://${query.domain}` };
      }
    }
  }

  // Domain Search fallback — https://hunter.io/api-documentation/v2#domain-search — best-guess contact on the domain.
  const params = new URLSearchParams({ domain: query.domain!, limit: "1", api_key: env.hunterApiKey });
  const response = await fetch(`https://api.hunter.io/v2/domain-search?${params.toString()}`);
  if (!response.ok) throw new Error(`Hunter API error: ${response.status} ${await response.text()}`);

  const data = (await response.json()) as {
    data?: { emails?: { value: string; first_name?: string; last_name?: string }[] };
  };
  const match = data.data?.emails?.[0];
  if (!match) return null;

  const matchedName = [match.first_name, match.last_name].filter(Boolean).join(" ");
  return { contactName: matchedName || query.contactName || "Unknown contact", email: match.value, website: `https://${query.domain}` };
}
