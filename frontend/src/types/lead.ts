export type LeadStatus = 'new' | 'contacted' | 'opened' | 'replied' | 'converted'
export type EnrichmentStatus = 'pending' | 'enriched' | 'failed'
export type LeadSource = 'csv' | 'search'

export interface Lead {
  id: string
  company: string
  contactName: string
  email: string | null
  website: string
  industry: string
  status: LeadStatus
  enrichment: EnrichmentStatus
  campaignId: string | null
  campaignName: string | null
  painPoint: string | null
  source: LeadSource
  createdAt: string
}

export interface CampaignOption {
  id: string
  name: string
}

export interface LeadFiltersState {
  search: string
  status: LeadStatus | 'all'
  industry: string
  campaignId: string
}

export interface FetchLeadsParams {
  page: number
  pageSize: number
  search?: string
  status?: LeadStatus | 'all'
  industry?: string
  campaignId?: string | 'all' | 'none'
  createdAfter?: string
  createdBefore?: string
}

export interface FetchLeadsResult {
  rows: Lead[]
  total: number
}

export interface CsvPreviewRow {
  rowNumber: number
  company: string
  contactName: string
  email: string
  website: string
  isValid: boolean
  issues: string[]
}

export interface CsvPreview {
  headers: string[]
  missingColumns: string[]
  rows: CsvPreviewRow[]
}

export interface ImportSummary {
  importedCount: number
  duplicateCount: number
  errorCount: number
  errorDetails: { row: number; reason: string }[]
}
