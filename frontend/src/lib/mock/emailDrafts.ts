import { fetchLead } from './leads'
import type { EmailDraft, EmailDraftStatus, PersonalizationVariable } from '../../types/email'
import type { Lead } from '../../types/lead'

// Prototype-only mock backend. Mirrors the future GPT-4 generation endpoint's
// signature, so EmailReviewPage doesn't change when a real backend lands.

const STORAGE_KEY = 'emberline.email-drafts.v1'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const OPENERS = [
  { subject: (company: string) => `Quick idea for ${company}`, hook: 'came across your site and had a quick thought' },
  { subject: (company: string) => `${company} + fewer missed follow-ups`, hook: 'wanted to flag something I noticed' },
  { subject: (company: string) => `Helping ${company} close more leads`, hook: 'figured this was worth a quick note' },
  { subject: (company: string) => `A question about ${company}'s pipeline`, hook: 'hope this lands at a good time' },
]

function firstName(contactName: string): string {
  return contactName.split(' ')[0] || contactName
}

function buildDraftContent(
  lead: Lead,
  variant: number,
): { subject: string; body: string; personalization: PersonalizationVariable[] } {
  const opener = OPENERS[variant % OPENERS.length]
  const painPoint = lead.painPoint ?? 'keeping the pipeline full'
  const subject = opener.subject(lead.company)
  const body = [
    `Hi ${firstName(lead.contactName)},`,
    '',
    `I ${opener.hook} — a lot of ${lead.industry.toLowerCase()} teams we talk to are dealing with ${painPoint}, and it's usually a follow-up problem, not a marketing one.`,
    '',
    `We help teams like ${lead.company} turn more inbound interest into booked business without adding headcount. Worth a 15-minute call this week?`,
    '',
    'Best,',
    'Emberline Outreach',
  ].join('\n')

  const personalization: PersonalizationVariable[] = [
    { label: 'Company', value: lead.company },
    { label: 'Industry', value: lead.industry },
    { label: 'Pain point', value: lead.painPoint ?? 'Not detected — using general framing' },
    { label: 'Contact', value: firstName(lead.contactName) },
  ]

  return { subject, body, personalization }
}

type Store = Record<string, EmailDraft>

let cache: Store | null = null
let variantCounter = 0

function readStore(): Store {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    cache = {}
  }
  return cache
}

function writeStore(store: Store) {
  cache = store
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function fetchEmailDraft(leadId: string): Promise<EmailDraft | undefined> {
  await delay(150)
  return readStore()[leadId]
}

export async function generateEmail(leadId: string): Promise<EmailDraft> {
  const lead = await fetchLead(leadId)
  if (!lead) throw new Error('Lead not found.')

  await delay(1300 + Math.random() * 700)

  if (Math.random() < 0.08) {
    throw new Error('Generation timed out. Try again.')
  }

  const { subject, body, personalization } = buildDraftContent(lead, variantCounter++)
  const draft: EmailDraft = {
    leadId,
    subject,
    body,
    status: 'draft',
    personalization,
    generatedAt: new Date().toISOString(),
    editedAt: null,
  }
  writeStore({ ...readStore(), [leadId]: draft })
  return draft
}

export async function saveEmailDraft(
  leadId: string,
  edits: { subject: string; body: string },
  status: EmailDraftStatus = 'edited',
): Promise<EmailDraft> {
  await delay(350)
  const store = readStore()
  const existing = store[leadId]
  if (!existing) throw new Error('No draft to save.')

  const updated: EmailDraft = {
    ...existing,
    subject: edits.subject,
    body: edits.body,
    status,
    editedAt: new Date().toISOString(),
  }
  writeStore({ ...store, [leadId]: updated })
  return updated
}

export async function bulkGenerateEmails(leadIds: string[]): Promise<{ count: number }> {
  await delay(200)
  leadIds.forEach((id, index) => {
    setTimeout(
      () => {
        generateEmail(id).catch(() => {
          // Individual failures surface when the lead is opened for review; bulk trigger doesn't block on them.
        })
      },
      300 + index * 250,
    )
  })
  return { count: leadIds.length }
}
