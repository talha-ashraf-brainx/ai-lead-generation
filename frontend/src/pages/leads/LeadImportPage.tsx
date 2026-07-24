import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CsvDropzone } from '../../components/leads/CsvDropzone'
import { CsvPreviewTable } from '../../components/leads/CsvPreviewTable'
import { ImportSummaryCard } from '../../components/leads/ImportSummaryCard'
import { KeywordSearchForm } from '../../components/leads/KeywordSearchForm'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { IconChevronLeft, IconFileText, IconSearch, IconSpinner } from '../../components/ui/icons'
import { importCsvRows, previewLeadsCsv, searchLeads } from '../../lib/mock/leads'
import type { CsvPreview, ImportSummary } from '../../types/lead'

type Tab = 'csv' | 'search'

export function LeadImportPage() {
  const [tab, setTab] = useState<Tab>('csv')

  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [csvSummary, setCsvSummary] = useState<ImportSummary | null>(null)
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)

  const [searchSummary, setSearchSummary] = useState<ImportSummary | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState<{ niche: string; location: string } | null>(null)

  async function handleFileSelected(file: File) {
    setCsvError(null)
    setCsvBusy(true)
    try {
      const preview = await previewLeadsCsv(file)
      setCsvPreview(preview)
    } catch {
      setCsvError('Could not read that file. Make sure it is a plain-text CSV export.')
    } finally {
      setCsvBusy(false)
    }
  }

  async function handleConfirmImport() {
    if (!csvPreview) return
    setCsvBusy(true)
    try {
      const summary = await importCsvRows(csvPreview.rows)
      setCsvSummary(summary)
    } finally {
      setCsvBusy(false)
    }
  }

  function resetCsv() {
    setCsvPreview(null)
    setCsvSummary(null)
    setCsvError(null)
  }

  async function handleSearch(niche: string, location: string) {
    setIsSearching(true)
    setLastQuery({ niche, location })
    try {
      const summary = await searchLeads(niche, location)
      setSearchSummary(summary)
    } finally {
      setIsSearching(false)
    }
  }

  function resetSearch() {
    setSearchSummary(null)
    setLastQuery(null)
  }

  const validRowCount = csvPreview?.rows.filter((row) => row.isValid).length ?? 0

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/leads"
        className="flex w-fit items-center gap-1 text-sm text-slate-400 hover:text-fog-100"
      >
        <IconChevronLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">Import leads</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload a CSV export or search a niche and location to source new leads.
        </p>
      </div>

      <div className="flex gap-1 rounded-md border border-graphite-700 bg-graphite-900 p-1 w-fit">
        <button
          onClick={() => setTab('csv')}
          className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'csv' ? 'bg-graphite-700 text-fog-50' : 'text-slate-400 hover:text-fog-100'
          }`}
        >
          <IconFileText className="h-4 w-4" />
          CSV upload
        </button>
        <button
          onClick={() => setTab('search')}
          className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'search' ? 'bg-graphite-700 text-fog-50' : 'text-slate-400 hover:text-fog-100'
          }`}
        >
          <IconSearch className="h-4 w-4" />
          Keyword search
        </button>
      </div>

      <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-6">
        {tab === 'csv' ? (
          csvSummary ? (
            <ImportSummaryCard summary={csvSummary} note="From CSV upload" onReset={resetCsv} />
          ) : csvError ? (
            <ErrorState description={csvError} onRetry={resetCsv} />
          ) : csvPreview ? (
            <div className="flex flex-col gap-4">
              <CsvPreviewTable preview={csvPreview} />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={resetCsv} disabled={csvBusy}>
                  Choose different file
                </Button>
                <Button onClick={handleConfirmImport} isLoading={csvBusy} disabled={validRowCount === 0}>
                  Import {validRowCount} row{validRowCount === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          ) : csvBusy ? (
            <div className="flex flex-col items-center gap-3 py-14 text-slate-400">
              <IconSpinner className="h-6 w-6 animate-spin" />
              <p className="text-sm">Reading file…</p>
            </div>
          ) : (
            <CsvDropzone onFileSelected={handleFileSelected} />
          )
        ) : searchSummary ? (
          <ImportSummaryCard
            summary={searchSummary}
            note={
              lastQuery
                ? `"${lastQuery.niche} in ${lastQuery.location}" — enrichment is running in the background`
                : undefined
            }
            onReset={resetSearch}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <KeywordSearchForm onSearch={handleSearch} isSearching={isSearching} />
            {isSearching && (
              <div className="flex items-center gap-2 rounded-md border border-graphite-700 bg-graphite-800 px-3 py-2.5 text-sm text-slate-400">
                <IconSpinner className="h-4 w-4 animate-spin text-primary" />
                Scraping directories for {lastQuery?.niche} in {lastQuery?.location}… this can take
                a few seconds. Feel free to keep navigating — we'll finish in the background.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
