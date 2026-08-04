import { apiFetch, buildQuery, isNotFound } from './client'
import type {
  CsvPreview,
  CsvPreviewRow,
  FetchLeadsParams,
  FetchLeadsResult,
  ImportSummary,
  Lead,
  LeadFiltersState,
} from '../../types/lead'

export const DEFAULT_LEAD_FILTERS: LeadFiltersState = {
  search: '',
  status: 'all',
  industry: 'all',
  campaignId: 'all',
}

interface ImportJob {
  id: string
  status: 'processing' | 'completed' | 'failed'
  importedCount: number
  duplicateCount: number
  errorCount: number
  errorMessage: string | null
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchLeads(params: FetchLeadsParams): Promise<FetchLeadsResult> {
  return apiFetch<FetchLeadsResult>(`/api/leads${buildQuery({ ...params })}`)
}

export async function fetchLead(id: string): Promise<Lead | undefined> {
  try {
    return await apiFetch<Lead>(`/api/leads/${id}`)
  } catch (err) {
    if (isNotFound(err)) return undefined
    throw err
  }
}

export async function listIndustries(): Promise<string[]> {
  return apiFetch<string[]>('/api/leads/industries')
}

export async function previewLeadsCsv(file: File): Promise<CsvPreview> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<CsvPreview>('/api/leads/csv/preview', { method: 'POST', body: formData })
}

export async function importCsvRows(rows: CsvPreviewRow[]): Promise<ImportSummary> {
  return apiFetch<ImportSummary>('/api/leads/csv/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  })
}

const SEARCH_POLL_INTERVAL_MS = 1000

export async function searchLeads(niche: string, location: string): Promise<ImportSummary> {
  const { jobId } = await apiFetch<{ jobId: string; status: string }>('/api/leads/search', {
    method: 'POST',
    body: JSON.stringify({ niche, location }),
  })

  for (;;) {
    const job = await apiFetch<ImportJob>(`/api/leads/import-jobs/${jobId}`)
    if (job.status === 'completed') {
      return {
        importedCount: job.importedCount,
        duplicateCount: job.duplicateCount,
        errorCount: job.errorCount,
        errorDetails: [],
      }
    }
    if (job.status === 'failed') {
      throw new Error(job.errorMessage ?? 'Lead search failed')
    }
    await delay(SEARCH_POLL_INTERVAL_MS)
  }
}

export async function bulkAddToCampaign(ids: string[], campaignId: string): Promise<void> {
  await apiFetch('/api/leads/bulk-add-to-campaign', {
    method: 'POST',
    body: JSON.stringify({ ids, campaignId }),
  })
}

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  await apiFetch('/api/leads/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}
