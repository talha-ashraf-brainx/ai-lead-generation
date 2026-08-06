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

export interface DiscoveredPerson {
  contactName: string;
  company: string;
  website: string;
  industry: string;
}

const DISCOVERY_RESULTS_PER_SEARCH = env.debug ? 5 : 25;

// Apollo People Search — https://docs.apollo.io/reference/people-api-search. Discovery-only:
// it lists people at organizations matching the niche/location, but never reveals an
// email (that costs a credit and only happens per-lead, via enrichWithApollo above once
// the lead's already been created and queued for enrichment). Note: on Basic-tier Apollo
// plans, `last_name` comes back obfuscated (e.g. "Ca***r") as `last_name_obfuscated`
// instead — that's an Apollo plan limit, not something this client can work around.
export async function searchPeopleWithApollo(niche: string, location: string): Promise<DiscoveredPerson[]> {
  if (!env.apolloApiKey) throw new Error("APOLLO_API_KEY is not configured");

  const response = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": env.apolloApiKey,
    },
    body: JSON.stringify({
      q_organization_keyword_tags: [niche],
      organization_locations: [location],
      page: 1,
      per_page: DISCOVERY_RESULTS_PER_SEARCH,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    people?: {
      name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      last_name_obfuscated?: string | null;
      organization?: { name?: string | null; website_url?: string | null; industry?: string | null } | null;
    }[];
  };

  return (data.people ?? [])
    .filter((person) => person.organization?.name)
    .map((person) => ({
      contactName:
        person.name ||
        [person.first_name, person.last_name || person.last_name_obfuscated].filter(Boolean).join(" ") ||
        "Unknown contact",
      company: person.organization!.name!,
      website: person.organization?.website_url ?? "",
      industry: person.organization?.industry || niche,
    }));
}

// Apollo caps /people/match at 50 calls/minute — a single search can create 25 leads
// that all enqueue enrichment near-simultaneously, so without this gate nearly every
// one of them gets 429'd instead of actually attempting a match.
const PEOPLE_MATCH_MIN_GAP_MS = 1300;
let peopleMatchQueue: Promise<void> = Promise.resolve();

function throttlePeopleMatch<T>(run: () => Promise<T>): Promise<T> {
  const turn = peopleMatchQueue.then(run, run);
  peopleMatchQueue = turn.then(
    () => new Promise((resolve) => setTimeout(resolve, PEOPLE_MATCH_MIN_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, PEOPLE_MATCH_MIN_GAP_MS)),
  );
  return turn;
}

// Apollo People Match — https://docs.apollo.io/reference/people-match. Primary
// provider for lead enrichment (Hunter is the fallback, per SRS Section 5).
export async function enrichWithApollo(query: EnrichmentQuery): Promise<EnrichmentResult> {
  if (!env.apolloApiKey) throw new Error("APOLLO_API_KEY is not configured");

  const [firstName, ...rest] = (query.contactName ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");
  // A discovery-sourced lead's last name can be Apollo's own obfuscated placeholder
  // (e.g. "Hi***d") — sending that back as a literal search term can only ever fail,
  // so it's dropped in favor of a broader first-name + organization-only match.
  const lastNameForMatch = lastName && !lastName.includes("*") ? lastName : undefined;

  const response = await throttlePeopleMatch(() =>
    fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": env.apolloApiKey,
      },
      body: JSON.stringify({
        first_name: firstName || undefined,
        last_name: lastNameForMatch,
        organization_name: query.company,
        domain: query.domain,
        reveal_personal_emails: true,
      }),
    }),
  );

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
