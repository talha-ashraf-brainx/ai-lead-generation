// Synthetic lead generator used only in SEED_MODE, so the "search a niche + location"
// demo flow works before the real Apollo/Hunter client lands in Phase 3.

const BUSINESS_WORDS = ["Clinic", "Studio", "Group", "Practice", "Partners", "Associates", "Care", "Collective"];
const FIRST_NAMES = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "Jacob"];
const LAST_NAMES = ["Bennett", "Clarke", "Hughes", "Patel", "Nguyen", "Romero", "Fischer", "Okafor", "Sato", "Morales"];
const PAIN_POINTS = [
  "low online booking volume",
  "inconsistent review scores",
  "slow response to inbound inquiries",
  "no automated follow-up on quotes",
  "high no-show rate",
  "outdated website conversion funnel",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "lead";
}

export interface SeedLead {
  company: string;
  contactName: string;
  email: string;
  website: string;
  industry: string;
  painPoint: string;
}

export function generateSeedLeads(niche: string, location: string): SeedLead[] {
  const nicheLabel = titleCase(niche);
  const locationLabel = titleCase(location);
  const industry = nicheLabel.split(" ")[0] || "General";
  const count = 10 + Math.floor(Math.random() * 13);

  return Array.from({ length: count }, () => {
    const contactFirst = pick(FIRST_NAMES);
    const contactLast = pick(LAST_NAMES);
    const company = `${locationLabel} ${nicheLabel} ${pick(BUSINESS_WORDS)}`;
    const slug = `${slugify(company)}${Math.floor(Math.random() * 900 + 100)}`;

    return {
      company,
      contactName: `${contactFirst} ${contactLast}`,
      email: `${contactFirst.toLowerCase()}.${contactLast.toLowerCase()}@${slug}.com`,
      website: `https://${slug}.com`,
      industry,
      painPoint: pick(PAIN_POINTS),
    };
  });
}
