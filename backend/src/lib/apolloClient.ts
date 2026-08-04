import { env } from "./env.js";

export interface EnrichmentQuery {
  company: string;
  contactName?: string | null;
  domain?: string;
}

export interface EnrichmentResult {
  contactName: string;
  email: string;
  website: string;
}

// Apollo People Match — https://docs.apollo.io/reference/people-match. Primary
// provider for lead enrichment (Hunter is the fallback, per SRS Section 5).
export async function enrichWithApollo(query: EnrichmentQuery): Promise<EnrichmentResult> {
  if (!env.apolloApiKey) throw new Error("APOLLO_API_KEY is not configured");

  const [firstName, ...rest] = (query.contactName ?? "").trim().split(/\s+/).filter(Boolean);

  const response = await fetch("https://api.apollo.io/api/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": env.apolloApiKey,
    },
    body: JSON.stringify({
      first_name: firstName || undefined,
      last_name: rest.length ? rest.join(" ") : undefined,
      organization_name: query.company,
      domain: query.domain,
      reveal_personal_emails: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    person?: { name?: string; email?: string | null; organization?: { website_url?: string } };
  };

  const person = data.person;
  if (!person?.email) throw new Error("Apollo returned no matching person with a revealed email");

  return {
    contactName: person.name || query.contactName || "Unknown contact",
    email: person.email,
    website: person.organization?.website_url ?? (query.domain ? `https://${query.domain}` : ""),
  };
}
