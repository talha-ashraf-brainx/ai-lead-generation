import { parseLeadsCsv } from '../csv'
import type {
  CampaignOption,
  CsvPreview,
  CsvPreviewRow,
  FetchLeadsParams,
  FetchLeadsResult,
  ImportSummary,
  Lead,
  LeadFiltersState,
} from '../../types/lead'

// Prototype-only mock backend. Function signatures mirror what the real
// enrichment/scraping API will expose, so pages don't change when a real backend lands.

const STORAGE_KEY = 'emberline.leads.v1'

export const CAMPAIGN_OPTIONS: CampaignOption[] = [
  { id: 'camp_dental_intro', name: 'Dental Intro Outreach' },
  { id: 'camp_legal_q3', name: 'Legal Q3 Outreach' },
  { id: 'camp_fitness_launch', name: 'Fitness Studio Launch' },
]

const INDUSTRIES = [
  'Dental',
  'Legal Services',
  'Real Estate',
  'Fitness & Wellness',
  'Home Services',
  'Marketing Agencies',
  'Hospitality',
]

const BUSINESS_WORDS = ['Clinic', 'Studio', 'Group', 'Practice', 'Partners', 'Associates', 'Care', 'Collective']
const FIRST_NAMES = [
  'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'Lucas', 'Mia', 'Jacob', 'Amelia', 'Henry', 'Grace', 'Owen',
]
const LAST_NAMES = [
  'Bennett', 'Clarke', 'Hughes', 'Patel', 'Nguyen', 'Romero', 'Fischer',
  'Okafor', 'Sato', 'Morales', 'Whitfield', 'Larsen', 'Delgado', 'Voss',
]
const PAIN_POINTS = [
  'low online booking volume',
  'inconsistent review scores',
  'slow response to inbound inquiries',
  'no automated follow-up on quotes',
  'high no-show rate',
  'outdated website conversion funnel',
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ')
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16) || 'lead'
}

function weightedStatus(): Lead['status'] {
  const roll = Math.random()
  if (roll < 0.55) return 'contacted'
  if (roll < 0.8) return 'opened'
  if (roll < 0.93) return 'replied'
  return 'converted'
}

function weightedEnrichment(): Lead['enrichment'] {
  const roll = Math.random()
  if (roll < 0.85) return 'enriched'
  if (roll < 0.95) return 'pending'
  return 'failed'
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function seedLeads(): Lead[] {
  const leads: Lead[] = []
  const count = 140

  for (let i = 0; i < count; i++) {
    const industry = pick(INDUSTRIES)
    const contactFirst = pick(FIRST_NAMES)
    const contactLast = pick(LAST_NAMES)
    const company = `${titleCase(industry.split(' ')[0])} ${pick(BUSINESS_WORDS)} ${i + 1}`
    const slug = slugify(company)
    const hasCampaign = Math.random() < 0.7
    const campaign = hasCampaign ? pick(CAMPAIGN_OPTIONS) : null
    const createdDaysAgo = Math.floor(Math.random() * 45)

    leads.push({
      id: makeId(),
      company,
      contactName: `${contactFirst} ${contactLast}`,
      email: `${contactFirst.toLowerCase()}.${contactLast.toLowerCase()}@${slug}.com`,
      website: `https://${slug}.com`,
      industry,
      status: weightedStatus(),
      enrichment: weightedEnrichment(),
      campaignId: campaign?.id ?? null,
      campaignName: campaign?.name ?? null,
      painPoint: pick(PAIN_POINTS),
      source: Math.random() < 0.5 ? 'search' : 'csv',
      createdAt: new Date(Date.now() - createdDaysAgo * 86_400_000).toISOString(),
    })
  }

  return leads
}

let cache: Lead[] | null = null

function readStore(): Lead[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw) as Lead[]
      return cache
    }
  } catch {
    // fall through to reseed on corrupt storage
  }
  cache = seedLeads()
  writeStore(cache)
  return cache
}

function writeStore(leads: Lead[]) {
  cache = leads
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  notifyListeners()
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeToLeads(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export async function fetchLeads(params: FetchLeadsParams): Promise<FetchLeadsResult> {
  await delay(350)
  const store = readStore()

  const search = params.search?.trim().toLowerCase()
  const filtered = store.filter((lead) => {
    if (search) {
      const haystack = `${lead.company} ${lead.contactName} ${lead.email ?? ''}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (params.status && params.status !== 'all' && lead.status !== params.status) return false
    if (params.industry && params.industry !== 'all' && lead.industry !== params.industry) return false
    if (params.campaignId === 'none' && lead.campaignId !== null) return false
    if (
      params.campaignId &&
      params.campaignId !== 'all' &&
      params.campaignId !== 'none' &&
      lead.campaignId !== params.campaignId
    ) {
      return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const start = (params.page - 1) * params.pageSize
  const rows = sorted.slice(start, start + params.pageSize)

  return { rows, total: sorted.length }
}

export async function fetchLead(id: string): Promise<Lead | undefined> {
  await delay(250)
  return readStore().find((lead) => lead.id === id)
}

export function listIndustries(): string[] {
  return Array.from(new Set(readStore().map((lead) => lead.industry))).sort()
}

export function listCampaignOptions(): CampaignOption[] {
  return CAMPAIGN_OPTIONS
}

export const DEFAULT_LEAD_FILTERS: LeadFiltersState = {
  search: '',
  status: 'all',
  industry: 'all',
  campaignId: 'all',
}

export async function previewLeadsCsv(file: File): Promise<CsvPreview> {
  const text = await file.text()
  await delay(200)
  return parseLeadsCsv(text)
}

export async function importCsvRows(rows: CsvPreviewRow[]): Promise<ImportSummary> {
  await delay(600)
  const store = readStore()
  const existingEmails = new Set(store.map((lead) => lead.email?.toLowerCase()).filter(Boolean))

  const errorDetails = rows
    .filter((row) => !row.isValid)
    .map((row) => ({ row: row.rowNumber, reason: row.issues.join(', ') }))

  const newLeads: Lead[] = []
  let duplicateCount = 0

  for (const row of rows) {
    if (!row.isValid) continue
    if (existingEmails.has(row.email.toLowerCase())) {
      duplicateCount++
      continue
    }
    existingEmails.add(row.email.toLowerCase())
    newLeads.push({
      id: makeId(),
      company: row.company,
      contactName: row.contactName || 'Unknown contact',
      email: row.email,
      website: row.website || '',
      industry: 'Imported',
      status: 'contacted',
      enrichment: 'enriched',
      campaignId: null,
      campaignName: null,
      painPoint: null,
      source: 'csv',
      createdAt: new Date().toISOString(),
    })
  }

  writeStore([...newLeads, ...store])

  return {
    importedCount: newLeads.length,
    duplicateCount,
    errorCount: errorDetails.length,
    errorDetails,
  }
}

export async function searchLeads(niche: string, location: string): Promise<ImportSummary> {
  await delay(1800)

  const nicheLabel = titleCase(niche)
  const locationLabel = titleCase(location)
  const industry = nicheLabel.split(' ')[0] || 'General'
  const count = 10 + Math.floor(Math.random() * 13)

  const created: Lead[] = Array.from({ length: count }, () => {
    const contactFirst = pick(FIRST_NAMES)
    const contactLast = pick(LAST_NAMES)
    const company = `${locationLabel} ${nicheLabel} ${pick(BUSINESS_WORDS)}`
    const slug = `${slugify(company)}${Math.floor(Math.random() * 900 + 100)}`

    return {
      id: makeId(),
      company,
      contactName: `${contactFirst} ${contactLast}`,
      email: `${contactFirst.toLowerCase()}.${contactLast.toLowerCase()}@${slug}.com`,
      website: `https://${slug}.com`,
      industry,
      status: 'contacted',
      enrichment: 'pending',
      campaignId: null,
      campaignName: null,
      painPoint: pick(PAIN_POINTS),
      source: 'search',
      createdAt: new Date().toISOString(),
    }
  })

  writeStore([...created, ...readStore()])
  scheduleEnrichment(created.map((lead) => lead.id))

  return {
    importedCount: created.length,
    duplicateCount: 0,
    errorCount: 0,
    errorDetails: [],
  }
}

function scheduleEnrichment(ids: string[]) {
  ids.forEach((id, index) => {
    setTimeout(
      () => {
        const store = readStore()
        const updated = store.map((lead) =>
          lead.id === id ? { ...lead, enrichment: Math.random() < 0.9 ? 'enriched' as const : 'failed' as const } : lead,
        )
        writeStore(updated)
      },
      1200 + index * 220 + Math.random() * 400,
    )
  })
}

export async function bulkAddToCampaign(ids: string[], campaignId: string): Promise<void> {
  await delay(400)
  const campaign = CAMPAIGN_OPTIONS.find((option) => option.id === campaignId)
  const idSet = new Set(ids)
  const updated = readStore().map((lead) =>
    idSet.has(lead.id)
      ? { ...lead, campaignId: campaign?.id ?? null, campaignName: campaign?.name ?? null }
      : lead,
  )
  writeStore(updated)
}

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  await delay(400)
  const idSet = new Set(ids)
  writeStore(readStore().filter((lead) => !idSet.has(lead.id)))
}
